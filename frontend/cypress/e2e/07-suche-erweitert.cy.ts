/// <reference types="cypress" />

/**
 *Erweiterte Suchfälle
 *
 * Sollte man testen weil Nutzer Suchbegriffe aus Daten
 * oft mit Sonderzeichen, Umlauten oder anderen Dinge schreiben. Die App muss das ohne Probleme handeln können.
 */
describe('Erweiterte Suche', () => {
  beforeEach(() => {
    cy.visitApp();
  });

  it('verarbeitet Suchbegriffe mit Sonderzeichen ohne Absturz', () => {
    const term = '%<&äöüß';

    cy.intercept('GET', '/api/games/search*').as('searchGames');
    cy.get('.search-bar__input').type(term);
    cy.get('.search-bar__button').click();
    cy.wait('@searchGames');

    cy.get('.game-list').should('exist');
    cy.get('body').then(($body) => {
      const hasCards = $body.find('.game-card').length > 0;
      const hasEmptyState = $body.find('.game-list__status-title').text().includes('No Games Found');
      expect(hasCards || hasEmptyState).to.eq(true);
    });
  });

  it('verarbeitet einen sehr langen Suchbegriff ohne Hänger oder Crash', () => {
    const term = `SehrLangerSuchbegriff-${'x'.repeat(220)}`;

    cy.intercept('GET', '/api/games/search*').as('searchGames');
    cy.get('.search-bar__input').type(term);
    cy.get('.search-bar__button').click();
    cy.wait('@searchGames');

    cy.get('.game-list').should('exist');
    cy.get('body').then(($body) => {
      const hasCards = $body.find('.game-card').length > 0;
      const hasEmptyState = $body.find('.game-list__status-title').text().includes('No Games Found');
      expect(hasCards || hasEmptyState).to.eq(true);
    });
  });

  it('löst Suche erst bei Submit aus und nicht bei jedem Tastendruck', () => {
    let searchCount = 0;
    cy.intercept('GET', '/api/games/search*', (req) => {
      searchCount += 1;
      req.continue();
    }).as('searchGames');

    cy.get('.search-bar__input').type('Witcher');
    cy.wrap(null).then(() => {
      expect(searchCount).to.eq(0);
    });

    cy.get('.search-bar__button').click();
    cy.wait('@searchGames');
    cy.wrap(null).then(() => {
      expect(searchCount).to.eq(1);
    });

    cy.get('.search-bar__input').clear().type('Skyrim{enter}');
    cy.wait('@searchGames');
    cy.wrap(null).then(() => {
      expect(searchCount).to.eq(2);
    });
  });
});
