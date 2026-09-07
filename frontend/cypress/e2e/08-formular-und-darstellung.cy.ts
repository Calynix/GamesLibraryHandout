/// <reference types="cypress" />

/**
 * Formularverhalten und Karten-Darstellung
 *
 * Bearbeitete Daten dürfen nach Cancel nicht verloren gehen und Bilder
 * müssen bei fehlender URL und auch bei defekter URL richtig ersetzt werden.
 */
describe('Formular und Darstellung', () => {
  const uniqueSuffix = () => Date.now().toString();

  beforeEach(() => {
    cy.visitApp();
  });

  afterEach(() => {
    cy.get('body').then(($body) => {
      const titles = Array.from($body.find('.game-card__title')).map((el) => el.textContent?.trim() ?? '');
      titles
        .filter((title) => title.includes('Cypress Formular'))
        .forEach((title) => cy.deleteGameByTitle(title));
    });
  });

  it('behält Originaldaten beim Abbrechen einer Bearbeitung unverändert', () => {
    const suffix = uniqueSuffix();
    const originalTitle = `Cypress Formular Original ${suffix}`;
    const originalDescription = 'Originalbeschreibung für den Abbruchtest.';
    const updatedTitle = `Cypress Formular Geändert ${suffix}`;

    cy.openAddGameForm();
    cy.fillGameForm({
      title: originalTitle,
      description: originalDescription,
      releaseDate: '2020-04-01',
    });
    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGame');

    cy.contains('.game-card', originalTitle).within(() => {
      cy.get('.game-card__btn--edit').click();
    });

    cy.get('.game-form input[name="title"]').clear().type(updatedTitle);
    cy.get('.game-form textarea[name="description"]').clear().type('Neue Beschreibung');
    cy.get('.game-form__btn--cancel').click();

    cy.contains('.game-card', originalTitle).within(() => {
      cy.get('.game-card__title').should('have.text', originalTitle);
      cy.get('.game-card__description').should('have.text', originalDescription);
    });
    cy.contains('.game-card__title', updatedTitle).should('not.exist');
  });

  it('zeigt bei kaputter Bild-URL den No-Image-Fallback ohne img-Element', () => {
    const title = `Cypress Formular Broken Image ${uniqueSuffix()}`;

    cy.openAddGameForm();
    cy.fillGameForm({
      title,
      description: 'Spiel mit absichtlich defekter Bild-URL.',
      imageUrl: 'http://127.0.0.1:1/does-not-exist.jpg',
      releaseDate: '2021-08-11',
    });
    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGame');

    cy.contains('.game-card', title).within(() => {
      cy.get('.game-card__no-image').should('be.visible').and('contain.text', 'No Image');
      cy.get('img.game-card__image').should('not.exist');
    });
  });

  it('zeigt auch ohne Bild-URL den No-Image-Fallback', () => {
    const title = `Cypress Formular No Image ${uniqueSuffix()}`;

    cy.openAddGameForm();
    cy.fillGameForm({
      title,
      description: 'Spiel ohne Bild-URL.',
      releaseDate: '2022-02-14',
    });
    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGame');

    cy.contains('.game-card', title).within(() => {
      cy.get('.game-card__no-image').should('be.visible').and('contain.text', 'No Image');
      cy.get('img.game-card__image').should('not.exist');
    });
  });
});
