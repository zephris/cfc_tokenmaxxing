const screens = [...document.querySelectorAll('.screen')];

const navAssets = {
  identify: {
    identify: 'https://www.figma.com/api/mcp/asset/7c488cdf-518f-4f4a-afaa-84a16aa4de47.svg',
    explore: 'https://www.figma.com/api/mcp/asset/9867b0c9-6d72-4732-8204-0a2aed158352.svg',
    map: 'https://www.figma.com/api/mcp/asset/92d2f9b5-0f5a-4342-b5ff-6449b3ebad71.svg',
    mark: 'https://www.figma.com/api/mcp/asset/bf9d2f59-7c35-4963-8277-da42f1010253.svg'
  },

  explore: {
    identify: 'https://www.figma.com/api/mcp/asset/cef0ceef-83c6-4fa1-a9f8-ed6e9b14a796.svg',
    explore: 'https://www.figma.com/api/mcp/asset/8e37b70c-bd4d-4273-a40c-c79812fa6299.svg',
    map: 'https://www.figma.com/api/mcp/asset/82cf6965-0c5b-406c-b727-0bb99b29f1bd.svg',
    mark: 'https://www.figma.com/api/mcp/asset/da498e6f-f405-42ad-a5a6-2501bd929d37.svg'
  },

  map: {
    identify: 'https://www.figma.com/api/mcp/asset/c130af66-b7cc-406f-b7b5-24cd2b5ec07c.svg',
    explore: 'https://www.figma.com/api/mcp/asset/fe203fc3-9fdb-4738-87bc-09727a4657ad.svg',
    map: 'https://www.figma.com/api/mcp/asset/0ec5fd15-b65b-43e6-afb3-4fd764cd6690.svg',
    mark: 'https://www.figma.com/api/mcp/asset/46048979-89a8-4994-b88c-877ca8c55c85.svg'
  }
};

const navItems = [
  { id: 'identify', label: 'Identify' },
  { id: 'explore', label: 'Explore' },
  { id: 'map', label: 'Map' }
];

const state = {
  selectedLocation: null,
  pendingLocation: 'Bold Park',
  speciesConfirmed: false,
  uploadedImageUrl: null
};


/* =========================
   SCREEN NAVIGATION
========================= */

function showScreen(id) {

  screens.forEach(screen => {

    screen.classList.toggle(
      'active-screen',
      screen.id === id
    );

  });


  if (navAssets[id]) {

    renderNav(id);

  }


  const activeScreen =
    document.getElementById(id);


  if (activeScreen) {

    activeScreen.scrollTop = 0;


    const nestedScroller =
      activeScreen.querySelector(
        '.ecology-scroll'
      );


    if (nestedScroller) {

      nestedScroller.scrollTop = 0;

    }

  }

}


/* =========================
   BOTTOM NAVIGATION
========================= */

function renderNav(active) {

  const assets =
    navAssets[active];


  document
    .querySelectorAll('.bottom-nav')
    .forEach(nav => {

      nav.innerHTML =
        navItems
          .map(item => `

            <button
              class="nav-item ${
                active === item.id
                  ? 'active'
                  : ''
              }"
              type="button"
              data-screen="${item.id}"
              aria-label="${item.label}"
            >

              <img
                class="nav-icon"
                src="${assets[item.id]}"
                alt=""
              >

              <span>
                ${item.label}
              </span>

              <img
                class="nav-active-mark"
                src="${assets.mark}"
                alt=""
              >

            </button>

          `)
          .join('');

    });

}


/* =========================
   PASSWORD VISIBILITY
========================= */

function togglePassword() {

  const input =
    document.querySelector(
      '#password-input'
    );


  if (!input) return;


  input.type =
    input.type === 'password'
      ? 'text'
      : 'password';

}


/* =========================
   EVENT JOIN
========================= */

function toggleJoin(button) {

  const joined =
    button.classList.toggle(
      'joined'
    );


  const label =
    button.querySelector(
      'span'
    );


  if (label) {

    label.textContent =
      joined
        ? 'You’re joining'
        : 'Join this event';

  }

}


/* =========================
   IMAGE UPLOAD
========================= */

function openImagePicker() {

  document
    .querySelector(
      '#plant-image-input'
    )
    ?.click();

}


function setUploadedImage(file) {

  if (!file) return;


  if (state.uploadedImageUrl) {

    URL.revokeObjectURL(
      state.uploadedImageUrl
    );

  }


  state.uploadedImageUrl =
    URL.createObjectURL(file);


  const cameraImage =
    document.querySelector(
      '.camera-image'
    );


  const reportedImage =
    document.querySelector(
      '#reported-plant-image'
    );


  if (cameraImage) {

    cameraImage.src =
      state.uploadedImageUrl;

  }


  if (reportedImage) {

    reportedImage.src =
      state.uploadedImageUrl;

  }


  showScreen('identify');

}


/* =========================
   SPECIES CONFIRMATION
========================= */

function confirmSpecies(button) {

  state.speciesConfirmed =
    !state.speciesConfirmed;


  button.classList.toggle(
    'confirmed',
    state.speciesConfirmed
  );


  button.textContent =
    state.speciesConfirmed
      ? 'Species confirmed'
      : 'Confirm species';

}


/* =========================
   LOCATION SELECTION
========================= */

function selectLocation(button) {

  const name =
    button?.dataset.location;


  if (!name) return;


  state.pendingLocation =
    name;


  document
    .querySelectorAll(
      '.location-option'
    )
    .forEach(option => {

      option.classList.toggle(
        'selected',
        option === button
      );

    });


  const pickerLabel =
    document.querySelector(
      '#location-control-label'
    );


  if (pickerLabel) {

    pickerLabel.textContent =
      name;

  }

}


function applySelectedLocation() {

  const label =
    document.querySelector(
      '#selected-location-label'
    );


  if (!label) return;


  label.textContent =
    state.selectedLocation ||
    'Select a location';


  label.style.color =
    state.selectedLocation
      ? '#111111'
      : '';

}


/* =========================
   LOCATION SEARCH
========================= */

function filterLocations(query) {

  const normalized =
    query
      .trim()
      .toLowerCase();


  document
    .querySelectorAll(
      '.location-option'
    )
    .forEach(option => {

      const haystack =
        `${
          option.dataset.location || ''
        } ${
          option.dataset.locationDetail || ''
        }`
        .toLowerCase();


      option.hidden =
        Boolean(
          normalized &&
          !haystack.includes(
            normalized
          )
        );

    });

}


/* =========================
   FILE INPUT
========================= */

document.addEventListener(
  'change',
  event => {

    if (
      event.target.id ===
      'plant-image-input'
    ) {

      setUploadedImage(
        event.target.files?.[0]
      );


      event.target.value = '';

    }

  }
);


/* =========================
   LOCATION SEARCH INPUT
========================= */

document.addEventListener(
  'input',
  event => {

    if (
      event.target.id ===
      'location-search-input'
    ) {

      filterLocations(
        event.target.value
      );

    }

  }
);


/* =========================
   MAIN CLICK HANDLER
========================= */

document.addEventListener(
  'click',
  event => {


    /* LOCATION OPTION */

    const locationOption =
      event.target.closest(
        '.location-option'
      );


    if (locationOption) {

      selectLocation(
        locationOption
      );

      return;

    }


    /* BOTTOM NAVIGATION */

    const nav =
      event.target.closest(
        '[data-screen]'
      );


    if (nav) {

      showScreen(
        nav.dataset.screen
      );

      return;

    }


    /* ACTION BUTTONS */

    const actionButton =
      event.target.closest(
        '[data-action]'
      );


    const action =
      actionButton?.dataset.action;


    if (!action) return;


    switch (action) {


      /* ONBOARDING */

      case 'show-landing':

        showScreen(
          'login'
        );

        break;


      case 'show-email-login':

        showScreen(
          'email-login'
        );

        break;


      case 'enter-app':

        showScreen(
          'identify'
        );

        break;


      /* LOGIN */

      case 'toggle-password':

        togglePassword();

        break;


      /* IMAGE */

      case 'upload-image':

      case 'choose-library':

        openImagePicker();

        break;


      /* IDENTIFICATION */

      case 'show-species':

        showScreen(
          'species'
        );

        break;


      case 'back-identify':

        showScreen(
          'identify'
        );

        break;


      case 'identification-failed':

        showScreen(
          'identification-failed'
        );

        break;


      case 'back-species':

        showScreen(
          'species'
        );

        break;


      case 'retake-photo':

        showScreen(
          'identify'
        );

        break;


      /* CONFIRM SPECIES */

      case 'confirm-species':

        confirmSpecies(
          actionButton
        );

        break;


      /* REPORT */

      case 'report-sighting':

        showScreen(
          'sighting-saved'
        );

        break;


      /* LOCATION */

      case 'choose-location': {

        const preferred =
          state.selectedLocation ||
          state.pendingLocation ||
          'Bold Park';


        const option =
          [
            ...document.querySelectorAll(
              '.location-option'
            )
          ]
          .find(
            item =>
              item.dataset.location ===
              preferred
          );


        if (option) {

          selectLocation(
            option
          );

        }


        showScreen(
          'choose-location'
        );

        break;

      }


      case 'toggle-location-menu':

        actionButton
          .closest(
            '.location-field-expanded'
          )
          ?.classList.toggle(
            'menu-closed'
          );

        break;


      case 'confirm-location':

        state.selectedLocation =
          state.pendingLocation;


        applySelectedLocation();


        showScreen(
          'sighting-saved'
        );

        break;


      case 'back-report':

        showScreen(
          'sighting-saved'
        );

        break;


      case 'finish-report': {

        state.speciesConfirmed =
          false;


        const confirmButton =
          document.querySelector(
            '#confirm-species-button'
          );


        if (confirmButton) {

          confirmButton
            .classList
            .remove(
              'confirmed'
            );


          confirmButton.textContent =
            'Confirm species';

        }


        showScreen(
          'identify'
        );

        break;

      }


      /* =========================
         BUSHLAND ECOLOGY
      ========================= */


      /*
        This is triggered by BOTH:

        1. The entire Bold Park card
        2. The "View ecology profile"
           button underneath it
      */

      case 'show-ecology-profile':

        showScreen(
          'ecology-profile'
        );

        break;


      /*
        Back arrow from the long
        Bushland Ecology Profile.
      */

      case 'back-explore':

        showScreen(
          'explore'
        );

        break;


      /* MAP + EVENTS */

      case 'show-event':

        showScreen(
          'event-details'
        );

        break;


      case 'back-map':

        showScreen(
          'map'
        );

        break;


      case 'join-event':

        toggleJoin(
          actionButton
        );

        break;

    }

  }
);


/* =========================
   INITIAL STATE
========================= */

selectLocation(
  document.querySelector(
    '.location-option.selected'
  )
);


applySelectedLocation();


renderNav('identify');