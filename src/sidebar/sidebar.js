/**
 * Options for radio buttons in the sidebar.
 * @typedef {Object} RadioOptions
 * @property {string} moveUp - Option for moving up.
 * @property {string} moveDown - Option for moving down.
 * @property {string} edit - Option for editing.
 * @property {string} delete - Option for deleting.
 */
const locationMenuOptions = {
  moveUp: "move-up",
  moveDown: "move-down",
  edit: "edit",
  delete: "delete",
};

/**
 * Adds a click event listener to the sidebar toggle button, toggling the "sidebar-is-collapsed" class
 * on the main container when the button is clicked.
 */
export function addSidebarToggleHandler() {
  const sidebarToggle = document.querySelector(".sidebar-collapse-toggle");

  sidebarToggle.addEventListener("click", () => {
    const main = document.querySelector(".main-container");
    main.classList.toggle("sidebar-is-collapsed");
  });
}

/**
 * Updates the places in the sidebar based on the given chapters.
 *
 * @param {Array} chapters - The chapters containing location information.
 */
export function updatePlaces(chapters) {
  const tilesContainer = document.querySelector(".location-tiles");
  chapters.forEach((chapter) => {
    const tile = createLocationTile(chapter);
    tilesContainer.appendChild(tile);
  });

  // The sidebar enables the user to add or edit new locations to the story.
  // Here we initialize the sidebar functionality.

  // Enable the drag and drop functionality for the location tiles
  initializeDraggableTiles();

  // Enable the edit menu for the each location tile
  initializeLocationDialog();

  // Enable the form submission when a radio button is selected
  addChangeEventListener(chapters);
}

/**
 * Creates a location tile element for a given chapter.
 *
 * @param {Object} chapter - The chapter object containing the title.
 * @returns {HTMLElement} - The created location tile element.
 */
function createLocationTile(chapter) {
  // Create elements
  const li = document.createElement("li");
  const p = document.createElement("p");
  const dialog = document.createElement("dialog");
  const form = document.createElement("form");
  const fieldset = document.createElement("fieldset");
  const button = document.createElement("button");
  const img = document.createElement("img");

  // Set attributes and content
  li.className = "location-tile";
  li.draggable = true;

  p.textContent = chapter.title;

  form.method = "dialog";
  form.dataset.name = chapter.title;
  form.setAttribute("key", chapter.title);

  Object.values(locationMenuOptions).forEach((option, index) => {
    const input = document.createElement("input");
    const label = document.createElement("label");

    const uniqueId = `${chapter.title}-${option}-${index}`;

    input.setAttribute("key", `${chapter.title}-${index}`);
    input.type = "radio";
    input.id = uniqueId;

    input.name = chapter.title;
    input.value = option;
    input.dataset.name = chapter.title;

    label.htmlFor = uniqueId;
    label.textContent = option.charAt(0).toUpperCase() + option.slice(1);

    fieldset.appendChild(input);
    fieldset.appendChild(label);
  });

  button.setAttribute("aria-label", "Open Settings");

  img.src = "./assets/icons/location-tile-hover.svg";
  img.alt = "";

  // Append elements
  button.appendChild(img);
  form.appendChild(fieldset);
  dialog.appendChild(form);
  li.appendChild(p);
  li.appendChild(dialog);
  li.appendChild(button);

  return li;
}

/**
 * Initializes the autocomplete functionality for the location input field.
 * @returns {Promise<void>} A promise that resolves when the autocomplete is initialized.
 */
export async function initAutoComplete() {
  const locationInput = document.querySelector(".locations-container input");

  // Todo: get correct fields
  const options = { fields: ["geometry"] };
  const autocomplete = new google.maps.places.Autocomplete(
    locationInput,
    options
  );

  // Listen to location changes
  autocomplete.addListener("place_changed", () => {
    const selectedPlace = autocomplete.getPlace();

    // Catch user pressed enter key without selecting a place in the list
    if (!selectedPlace.geometry) {
      return;
    }
    // Todo: do something with the location
    const { location } = selectedPlace.geometry;
  });

  // Disable form submission button when the input field is empty
  locationInput.addEventListener("input", () => {
    const locationSubmitButton = document.querySelector(".add-location-button");
    locationSubmitButton.disabled = locationInput.value === "";
  });
}
// A reference to the currently open dialog
let currentDialog = null;
// A reference to the abort controller used to cancel the events on dialog close
let dialogEventController;

/**
 * Initializes the sidebar functionality.
 */
function initializeLocationDialog() {
  // Add event listener to all details elements in the sidebar
  const details = document.querySelectorAll("#sidebar > details");

  details.forEach((section) => {
    section.addEventListener("toggle", toggleDetailsSection);
  });

  // Cache all dialog show buttons
  const dialogShowButtons = document.querySelectorAll("dialog + button");

  // Add event listener to all dialog show buttons
  dialogShowButtons.forEach((button) => {
    const dialog = button.previousElementSibling;
    button.addEventListener("click", (event) => {
      if (currentDialog) {
        closeDialog(currentDialog);
      }
      event.stopPropagation();
      currentDialog = dialog;
      dialog.show();
      createDialogCloseListeners(dialog);
    });
  });
}

/**
 * Toggles the details section based on the event's new state.
 * Closes all other details sections except the one with the specified target ID.
 * @param {Event} event - The event object containing the new state and target ID.
 */
const toggleDetailsSection = (event) => {
  if (event.newState === "open") {
    const details = document.querySelectorAll(
      `details:not(#${event.target.id})`
    );

    details.forEach((detail) => (detail.open = false));
  }
};

/**
 * Creates event listeners for closing a dialog.
 * @param {HTMLElement} dialog - The dialog element to be closed.
 */
function createDialogCloseListeners(dialog) {
  locationMenuEventController = new AbortController();

  document.addEventListener(
    "keydown",
    (event) => {
      const { key } = event;
      if (key === "Escape" && dialog) {
        closeDialog(dialog);
      }
    },
    { signal: locationMenuEventController.signal }
  );

  document.addEventListener(
    "click",
    (event) => {
      const { target } = event;
      if (!dialog.contains(target)) {
        closeDialog(dialog);
      }
    },
    { signal: locationMenuEventController.signal }
  );
}

// Helper function to close the dialog and aborts any ongoing event listeners
function closeDialog(dialog) {
  dialog.close();
  locationMenuEventController.abort();
  currentDialog = null;
}

/**
 * Initializes the draggable location tiles functionality.
 */
export function initDraggableTiles() {
  // Represents the collection of draggable location tiles.
  const draggableTiles = document.querySelectorAll(".location-tile");

  // Represents the container of the location tiles.
  const tilesContainer = document.querySelector(".location-tiles");

  // Add event listeners to all draggable tiles
  draggableTiles.forEach((draggable) => {
    draggable.addEventListener("dragstart", () => {
      draggable.classList.add("dragging");
    });

    draggable.addEventListener("dragend", () => {
      draggable.classList.remove("dragging");
    });
  });

  //
  tilesContainer.addEventListener("dragover", (event) => {
    event.preventDefault();

    const nextElement = getDragAfterElement(tilesContainer, event.clientY);
    const draggable = document.querySelector(".dragging");
    if (nextElement == null) {
      tilesContainer.appendChild(draggable);
    } else {
      tilesContainer.insertBefore(draggable, nextElement);
    }
  });
}

/**
 * Finds the element after which a dragged element should be inserted on the y-coordinate of the event.
 *
 * @param {HTMLElement} container - The container element that holds the draggable elements.
 * @param {number} draggedElementPositionY - The vertical position of the dragged element.
 * @returns {HTMLElement} - The element after which the dragged element should be inserted.
 */
function getDragAfterElement(container, draggedElementPositionY) {
  const draggableElements = [
    ...container.querySelectorAll(".location-tile:not(.dragging)"),
  ];

  // Find the element that is closest to the dragged element
  // by comparing the vertical position of the dragged element to the vertical position of the other elements.
  // The element with the smallest offset is the closest element.
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = draggedElementPositionY - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    // Set initial offset to negative infinity to ensure that the offset is always smaller than the initial value
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

/**
 * Adds a change event listener to each form element with the method attribute set to "dialog".
 * When a radio input is changed, the form is submitted and the dialog is closed.
 * @param {Array} chapters - An array of chapter objects.
 */
function addChangeEventListener(chapters) {
  var forms = document.querySelectorAll('form[method="dialog"]');
  forms.forEach(function (form) {
    // Attach a change event listener to each form
    form.addEventListener("change", function (event) {
      var target = event.target;

      // Check if the changed element is a radio input
      if (target.type === "radio") {
        // Submit the form
        form.requestSubmit();

        // The dialog element is automatically closed when the form is submitted
        // so we need to abort the event listeners here
        dialogEventController.abort();
        currentDialog = null;
      }
    });

    // Attach a submit event listener to each form
    form.addEventListener("submit", function () {
      // Get which radio input was selected
      const selectedAction = form.querySelector(
        'input[type="radio"]:checked'
      ).value;

      // Get which chapter the form belongs to
      const selectedChapter = form.getAttribute("key");

      const chapterIndex = chapters.findIndex(
        (chapter) => selectedChapter === chapter.title
      );

      handleFormDialogSubmit(selectedAction, chapterIndex);
    });
  });
}

function handleFormDialogSubmit(action, chapterIndex) {
  switch (action) {
    case locationMenuOptions.edit:
      console.log("Edit");

      const container = document.querySelector(".locations-container");

      // Add custom data-attribute to the container
      container.setAttribute("data-mode", locationMenuOptions.edit);

      break;
    case locationMenuOptions.delete:
      console.log("Delete");
      // Code for handling delete option
      break;
    case locationMenuOptions.moveUp:
      console.log("Move up");
      // Code for handling moveUp option
      break;
    case locationMenuOptions.moveDown:
      console.log("Move down");
      // Code for handling moveDown option
      break;
    default:
      console.warn("Invalid option type");
      // Code for handling default case
      break;
  }
  return null;
}
