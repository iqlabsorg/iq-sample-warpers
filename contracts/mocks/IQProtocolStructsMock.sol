// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/solidity-contracts-nft/contracts/asset/Assets.sol";

library IQProtocolStructsMock {
    /**
     * @dev Rental agreement information.
     * @param warpedAssets Rented asset(s).
     * @param universeId The Universe ID.
     * @param collectionId Warped collection ID.
     * @param listingId The corresponding ID of the original asset(s) listing.
     * @param renter The renter account address.
     * @param startTime The rental agreement staring time. This is the timestamp after which the `renter`
     * considered to be an warped asset(s) owner.
     * @param endTime The rental agreement ending time. After this timestamp, the rental agreement is terminated
     * and the `renter` is no longer the owner of the warped asset(s).
     * @param listingTerms Listing terms
     */
    struct Agreement {
        Assets.Asset[] warpedAssets;
        uint256 universeId;
        bytes32 collectionId;
        uint256 listingId;
        address renter;
        uint32 startTime;
        uint32 endTime;
        AgreementTerms agreementTerms;
    }

    struct AgreementTerms {
        ListingTerms listingTerms;
        TaxTerms universeTaxTerms;
        TaxTerms protocolTaxTerms;
        PaymentTokenData paymentTokenData;
    }

    /**
     * @dev Listing terms information.
     * @param strategyId Listing strategy ID.
     * @param strategyData Listing strategy data.
     */
    struct ListingTerms {
        bytes4 strategyId;
        bytes strategyData;
    }

    /**
     * @dev Tax terms information.
     * @param strategyId Tax strategy ID.
     * @param strategyData Tax strategy data.
     */
    struct TaxTerms {
        bytes4 strategyId;
        bytes strategyData;
    }

    /**
     * @dev Describes the universe-specific token quote data.
     * @param paymentToken Address of payment token.
     * @param paymentTokenQuote Quote of payment token in accordance to base token
     */
    struct PaymentTokenData {
        address paymentToken;
        uint256 paymentTokenQuote;
    }

    /**
     * @dev Describes the earning type.
     */
    enum EarningType {
        LISTER_FIXED_FEE,
        LISTER_EXTERNAL_ERC20_REWARD,
        RENTER_EXTERNAL_ERC20_REWARD,
        UNIVERSE_FIXED_FEE,
        UNIVERSE_EXTERNAL_ERC20_REWARD,
        PROTOCOL_FIXED_FEE,
        PROTOCOL_EXTERNAL_ERC20_REWARD
    }

    /**
     * @dev Describes the rent earning of user.
     */
    struct UserEarning {
        EarningType earningType;
        bool isLister;
        address account;
        uint256 value;
        address token;
    }

    /**
     * @dev Describes the rent earning of universe.
     */
    struct UniverseEarning {
        EarningType earningType;
        uint256 universeId;
        uint256 value;
        address token;
    }

    /**
     * @dev Describes the rent earning of protocol.
     */
    struct ProtocolEarning {
        EarningType earningType;
        uint256 value;
        address token;
    }

    /**
     * @dev Describes the rent earnings of users , universe and protocol.
     */
    struct RentalEarnings {
        UserEarning[] userEarnings;
        UniverseEarning universeEarning;
        ProtocolEarning protocolEarning;
    }
}
