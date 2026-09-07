/// <reference types="cypress" />

/**
 *Fehlerbehandlung
 *
 * Sollten testen dass falsche Backandantworten oder Server probelme korrekt gehandlet werden.
 */
describe('Fehlerbehandlung', () => {
  beforeEach(() => {
    cy.visitApp();
  });

  it('zeigt bei einem 500er auf dem initialen Laden die Fehlermeldung', () => {
    cy.intercept('GET', '/api/games', {
      statusCode: 500,
      body: {},
    }).as('getGamesFail');

    cy.reload();
    cy.wait('@getGamesFail');

    cy.get('.home-page__error').should('be.visible').and('contain.text', 'Fehler beim Laden der Spiele.');
  });

  it('zeigt bei einem 500er während der Suche eine Fehlermeldung', () => {
    cy.intercept('GET', '/api/games/search*', {
      statusCode: 500,
      body: {},
    }).as('searchFail');

    cy.get('.search-bar__input').type('Witcher');
    cy.get('.search-bar__button').click();
    cy.wait('@searchFail');

    cy.get('.home-page__error').should('be.visible').and('contain.text', 'Fehler bei der Suche.');
  });

  it('zeigt bei Netzwerkfehlern beim Erstellen eine Fehlermeldung und legt kein Spiel an', () => {
    const title = `Cypress Network Error ${Date.now()}`;

    cy.openAddGameForm();
    cy.fillGameForm({
      title,
      description: 'Dieses Spiel soll wegen eines Netzfehlers nicht gespeichert werden.',
      releaseDate: '2023-01-01',
    });

    // Ist-Zustand der App: der POST schlägt fehl, die Fehlermeldung erscheint,
    // und das Formular schliesst sich trotz Fehler nach dem await trotzdem.
    cy.intercept('POST', '/api/games', { forceNetworkError: true }).as('createGameError');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGameError');

    cy.get('.home-page__error').should('be.visible').and('contain.text', 'Fehler beim Erstellen des Spiels.');
    cy.contains('.game-card__title', title).should('not.exist');
    cy.get('.game-form').should('not.exist');
  });
});
