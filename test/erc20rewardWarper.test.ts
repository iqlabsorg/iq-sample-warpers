
describe("ERC20RewardWarper", function () {

  beforeEach(async () => {
    // TODO setup test environment
  })

  describe('constructor', () => {
    it('sets proper universe allocation')
    it('sets proper protocol allocation')
    it('sets proper universe treasury')
    it('sets proper reward pool')
  })

  describe('__onRent', () => {
    context('When called by non-Metahub', () => {
      it('reverts')
    })

    context('When called by Metahub', () => {
      context('When using `FIXED_PRICE` listing strategy', () => {
        it('stores the allocation')
        it('emits an event')
      })

      context('When using `FIXED_PRICE_WITH_REWARDS` listing strategy', () => {
        it('stores the allocation')
        it('emits an event')
      })
    })
  })

  describe('disperseRewards', () => {
    context('When called by non-authorized caller', () => {
      it('reverts')
    })

    context('When called with a token id with a rental that has not been rented', () => {
      it('reverts')
    })

    context('When dispersed correctly', () => {
      it('transfers correct % of rewards to the protocol')
      it('transfers correct % of rewards to the universe')
      it('transfers correct % of rewards to the lister')
      it('transfers correct % of rewards to the renter')
    })
  })
 })
