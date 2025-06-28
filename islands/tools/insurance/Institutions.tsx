// islands/tools/insurance/Institutions.tsx
import { Signal, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { JSX } from "preact";
import {
  addBounty,
  fetchUserData,
  getCommentsForContract,
  postComment,
} from "../../../utils/api/manifold_api_service.ts";
import {
  ManaPaymentTransaction,
  ManifoldComment,
  TipTapContentBlock,
} from "../../../utils/api/manifold_types.ts";
import { stripHtml } from "../../../utils/html_utils.ts";

interface InstitutionsProps {
  apiKey: Signal<string>;
  loanAmount: Signal<number>;
  username: Signal<string>; // Borrower username
  lenderUsername: Signal<string>;
  managramMessage: Signal<string>;
  insuranceFee: number | null;
  getPolicyEndDate: (loanDueDateStr: string) => string;
  loanDueDate: Signal<string>;
  selectedCoverage: Signal<number | null>;
  riskBaseFee: number;
  partnerCodeValid: Signal<boolean>;
  durationFee: number;

  isProcessingPayment: Signal<boolean>;
  paymentMessage: Signal<string>;
  paymentMessageType: Signal<"success" | "error" | "">;
  cooldownActive: Signal<boolean>;
  cooldownMessage: Signal<string>;

  institution: Signal<"BANK" | "IMF" | "RISK" | "OFFSHORE" | null>;
  useInstitution: Signal<boolean>;
}

const IMF_BOUNTY_MARKET_ID = "PdLcZARORc";
const BANK_BOUNTY_MARKET_ID = "tqQIAgd6EZ";
const RISK_BOUNTY_MARKET_ID = "QEytQ5ch0P";
const OFFSHORE_BOUNTY_MARKET_ID = "CAQchupgyN"; // New Offshore Market ID

const INSTITUTION_MARKETS: {
  [key: string]: { id: string; name: string; description: string };
} = {
  IMF: {
    id: IMF_BOUNTY_MARKET_ID,
    name: "IMF",
    description: "Awards loan as bounty on the IMF market.",
  },
  BANK: {
    id: BANK_BOUNTY_MARKET_ID,
    name: "BANK",
    description: "Awards loan as bounty on the BANK market.",
  },
  RISK: {
    id: RISK_BOUNTY_MARKET_ID,
    name: "RISK",
    description: "Awards loan as bounty on the RISK Payment Portal.",
  },
  OFFSHORE: {
    id: OFFSHORE_BOUNTY_MARKET_ID,
    name: "OFFSHORE",
    description: "Awards loan as bounty on the OFFSHORE market.",
  },
};

function extractTextFromTipTapContent(
  contentBlocks: TipTapContentBlock[],
): string {
  let text = "";
  if (!Array.isArray(contentBlocks)) {
    return text;
  }
  for (const block of contentBlocks) {
    if (block.type === "text" && typeof block.text === "string") {
      text += block.text;
    } else if (Array.isArray(block.content)) {
      text += extractTextFromTipTapContent(block.content);
    }
    if (
      block.type === "mention" && block.attrs &&
      typeof block.attrs.label === "string"
    ) {
      text += `@${block.attrs.label}`;
    }
  }
  return text;
}

export default function Institutions(props: InstitutionsProps): JSX.Element {
  const {
    apiKey,
    loanAmount,
    username, // Borrower username
    lenderUsername,
    insuranceFee,
    getPolicyEndDate,
    loanDueDate,
    selectedCoverage,
    riskBaseFee,
    partnerCodeValid,
    durationFee,
    isProcessingPayment,
    paymentMessage,
    paymentMessageType,
    cooldownActive,
    cooldownMessage,
    institution,
    useInstitution,
  } = props;

  const comments = useSignal<ManifoldComment[]>([]);
  const selectedCommentId = useSignal<string | null>(null);
  const fetchCommentsError = useSignal<string | null>(null);
  const isFetchingComments = useSignal(false);
  const awardBountyMessage = useSignal<string | null>(null);
  // awardBountyMessageType is still useful internally for logic, but not for direct styling classes
  const awardBountyMessageType = useSignal<
    "success" | "error" | "warning" | null
  >(null);
  const isConfirmingBounty = useSignal(false);
  const borrowerUserId = useSignal<string | null>(null);

  useEffect(() => {
    let timeoutId: number;
    if (isConfirmingBounty.value) {
      timeoutId = setTimeout(() => isConfirmingBounty.value = false, 4000);
    }
    return () => clearTimeout(timeoutId);
  }, [isConfirmingBounty.value]);

  useEffect(() => {
    async function getBorrowerId() {
      borrowerUserId.value = null;
      if (username.value) {
        try {
          const { userData, fetchSuccess } = await fetchUserData(
            username.value,
          );
          if (fetchSuccess && userData) {
            borrowerUserId.value = userData.id;
          } else {
            borrowerUserId.value = null;
          }
        } catch (error) {
          console.error(
            "Error fetching borrower ID for comment filtering:",
            error,
          );
          borrowerUserId.value = null;
        }
      }
    }
    getBorrowerId();
  }, [username.value]);

  useEffect(() => {
    async function fetchCommentsForSelectedInstitution() {
      if (useInstitution.value && institution.value && apiKey.value) {
        if (username.value && borrowerUserId.value === null) {
          return;
        }

        isFetchingComments.value = true;
        fetchCommentsError.value = null;
        selectedCommentId.value = null;
        awardBountyMessage.value = null;
        awardBountyMessageType.value = null;
        isConfirmingBounty.value = false;

        const marketId = institution.value
          ? INSTITUTION_MARKETS[institution.value]?.id
          : null;

        if (!marketId) {
          fetchCommentsError.value = "Invalid institution selected.";
          isFetchingComments.value = false;
          comments.value = [];
          return;
        }

        try {
          const result = await getCommentsForContract(
            marketId,
            borrowerUserId.value || undefined,
          );
          if (result.success && result.data) {
            comments.value = result.data
              .filter((comment) => {
                return comment.content &&
                  typeof comment.content === "object" &&
                  Array.isArray(comment.content.content) &&
                  extractTextFromTipTapContent(comment.content.content)
                      .trim() !== "";
              })
              .sort((a, b) => b.createdTime - a.createdTime);
          } else {
            fetchCommentsError.value = `Failed to fetch comments: ${
              result.error || "Unknown error"
            }`;
          }
        } catch (error: unknown) {
          fetchCommentsError.value = `Network error fetching comments: ${
            typeof error === "object" && error !== null && "message" in error
              ? (error as { message: string }).message
              : String(error)
          }`;
        } finally {
          isFetchingComments.value = false;
        }
      } else {
        comments.value = [];
        selectedCommentId.value = null;
        fetchCommentsError.value = null;
        awardBountyMessage.value = null;
        awardBountyMessageType.value = null;
        isConfirmingBounty.value = false;
      }
    }
    fetchCommentsForSelectedInstitution();
  }, [
    useInstitution.value,
    institution.value,
    apiKey.value,
    borrowerUserId.value,
  ]);

  useEffect(() => {
    if (!useInstitution.value) {
      institution.value = null;
      selectedCommentId.value = null;
      awardBountyMessage.value = null;
      awardBountyMessageType.value = null;
      paymentMessage.value = "";
      paymentMessageType.value = "";
      cooldownActive.value = false;
      cooldownMessage.value = "";
      isConfirmingBounty.value = false;
    }
  }, [useInstitution.value]);

  const handleInstitutionSelect = (
    selected: "BANK" | "IMF" | "RISK" | "OFFSHORE",
  ) => {
    institution.value = selected;
    selectedCommentId.value = null;
    awardBountyMessage.value = null;
    awardBountyMessageType.value = null;
    isConfirmingBounty.value = false;
  };

  const executeAwardBounty = async () => {
    isProcessingPayment.value = true;
    awardBountyMessage.value = null;
    awardBountyMessageType.value = null;
    paymentMessage.value = "";
    paymentMessageType.value = "";
    cooldownMessage.value = "";

    try {
      const targetMarketId = institution.value
        ? INSTITUTION_MARKETS[institution.value]?.id
        : null;

      if (!targetMarketId) {
        throw new Error(
          "Could not determine market ID for selected institution.",
        );
      }
      if (loanAmount.value <= 0) {
        throw new Error(
          "Loan amount must be greater than zero to award bounty.",
        );
      }
      if (insuranceFee === null || insuranceFee < 0) {
        throw new Error("Insurance fee is invalid. Please check loan details.");
      }

      const loanBountyResult = await addBounty(
        targetMarketId,
        loanAmount.value,
        selectedCommentId.value!,
        apiKey.value,
      );

      if (!loanBountyResult.success) {
        throw new Error(
          `Failed to award loan bounty: ${
            loanBountyResult.error || "Unknown error."
          }`,
        );
      }

      const insuranceBountyResult = await addBounty(
        RISK_BOUNTY_MARKET_ID,
        Math.round(insuranceFee),
        null,
        apiKey.value,
      );

      if (!insuranceBountyResult.success) {
        throw new Error(
          `Failed to add insurance fee to RISK market: ${
            insuranceBountyResult.error || "Unknown error."
          }`,
        );
      }

      const policyStartDate = new Date().toISOString().split("T")[0];
      const policyEndDate = getPolicyEndDate(loanDueDate.value);
      const coveragePercentage = selectedCoverage.value;
      const roundedInsuranceFee = Math.round(insuranceFee);

      let discountLine = "";
      if (partnerCodeValid.value) {
        discountLine = "\nDiscount Code Applied: 25%";
      }

      const localCoverageFees: { [key: number]: number } = {
        25: 0.02,
        50: 0.05,
        75: 0.08,
        100: 0.12,
      };
      const formattedCoverageFee = coveragePercentage !== null
        ? `${localCoverageFees[coveragePercentage] * 100}%`
        : "N/A";

      const receiptMessage = `# 🦝RISK Insurance Receipt

### Summary

Transaction ID (Loan Bounty): ${
        (loanBountyResult.data as ManaPaymentTransaction).id
      }
Transaction ID (Insurance Fee): ${
        (insuranceBountyResult.data as ManaPaymentTransaction).id
      }

Coverage: C${coveragePercentage}

Lender: @${lenderUsername.value}

Borrower: @${username.value}

Loan Amount (as Bounty): Ṁ${loanAmount.value}

Date of Policy Start: ${policyStartDate}

Loan Due Date: ${loanDueDate.value}

Policy Ends: ${policyEndDate}

### Fees

Base Fee (risk multiplier): ${riskBaseFee * 100}%

Coverage Fee: ${formattedCoverageFee}

Duration Fee: Ṁ${durationFee}

${discountLine}
Total Fee (to RISK): Ṁ${roundedInsuranceFee}

### Terms

By using this service, you agree to The Fine Print at the very bottom of our dashboard. 60% refund may be available if borrower repays on time and in full. No refund if borrower defaults, but insurance will cover the policy amount.

---

Have questions or need to activate coverage? Message @crowlsyong and we’ll walk you through it.


Risk Free 🦝RISK Fee Guarantee™️


🦝RISK: Recovery Loan Insurance Kiosk`;

      const postCommentResult = await postComment(
        targetMarketId,
        receiptMessage,
        apiKey.value,
      );

      if (!postCommentResult.success) {
        throw new Error(
          `Failed to post insurance receipt comment to ${institution.value} market: ${
            postCommentResult.error || "Unknown error."
          }`,
        );
      }

      // Success messages with emoji
      awardBountyMessage.value =
        `✅ Successfully awarded M${loanAmount.value} bounty to comment and paid M${roundedInsuranceFee} insurance fee to RISK!`;
      awardBountyMessageType.value = "success";
      paymentMessage.value =
        `✅ Loan (via bounty) and insurance fee processed via ${institution.value} institution.`;
      paymentMessageType.value = "success";
      cooldownActive.value = true;
    } catch (error: unknown) {
      // Error messages with emoji
      awardBountyMessage.value = `⛔ Error processing: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`;
      awardBountyMessageType.value = "error";
      paymentMessage.value = `⛔ Payment failed: ${awardBountyMessage.value}`;
      paymentMessageType.value = "error";
      cooldownActive.value = true;
    } finally {
      isProcessingPayment.value = false;
      isConfirmingBounty.value = false;
    }
  };

  const handleConfirmBountyClick = () => {
    // Clear any previous messages before initiating a new action or confirmation
    awardBountyMessage.value = null;
    awardBountyMessageType.value = null;
    paymentMessage.value = "";
    paymentMessageType.value = "";
    cooldownMessage.value = "";

    if (cooldownActive.value) {
      // Cooldown message with emoji
      awardBountyMessage.value = `⛔ ${cooldownMessage.value}`; // Add emoji to cooldown message
      awardBountyMessageType.value = "error";
      return;
    }

    if (
      !selectedCommentId.value || !apiKey.value || loanAmount.value <= 0 ||
      !username.value || !lenderUsername.value || !institution.value ||
      insuranceFee === null || insuranceFee < 0 || !loanDueDate.value ||
      selectedCoverage.value === null
    ) {
      // Validation error message with emoji
      awardBountyMessage.value =
        `⛔ Please fill in all required fields and select a comment before awarding.`;
      awardBountyMessageType.value = "error";
      return;
    }

    if (isConfirmingBounty.value) {
      executeAwardBounty();
    } else {
      isConfirmingBounty.value = true;
    }
  };

  const isBountyButtonDisabled = isProcessingPayment.value ||
    cooldownActive.value || !selectedCommentId.value || !apiKey.value ||
    loanAmount.value <= 0 || !username.value || !lenderUsername.value ||
    !institution.value || insuranceFee === null || insuranceFee < 0 ||
    !loanDueDate.value || selectedCoverage.value === null;

  let bountyButtonText = `Award M${loanAmount.value} Bounty & Pay RISK Fee (M${
    Math.round(insuranceFee || 0)
  })`;
  if (isProcessingPayment.value) {
    bountyButtonText = "Processing...";
  } else if (isConfirmingBounty.value) {
    bountyButtonText = "Are you sure? Click to Confirm Bounty";
  } else if (cooldownActive.value) {
    bountyButtonText = "Please wait...";
  }

  // Remove getMessageClass as it's no longer needed for text color/styling
  // Instead, the emoji directly indicates success/error.
  // The P tag will just use a neutral text color.

  return (
    <div class="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-md shadow-sm">
      <h3 class="text-lg font-bold text-gray-200 mb-4">
        Institutional Funding
      </h3>

      <div class="flex items-center justify-between mb-4">
        <label htmlFor="use-institution-toggle" class="text-gray-300 mr-2">
          Fund with an Institution?
        </label>
        <button
          id="use-institution-toggle"
          type="button"
          onClick={() => useInstitution.value = !useInstitution.value}
          class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            useInstitution.value ? "bg-blue-600" : "bg-gray-700"
          }`}
        >
          <span
            class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              useInstitution.value ? "translate-x-6" : "translate-x-1"
            }`}
          >
          </span>
        </button>
      </div>

      {useInstitution.value && (
        <>
          <p class="text-sm text-gray-400 mb-3">
            If selected, your loan mana will be awarded as a bounty on the
            chosen institution's market. Your insurance fee will also be paid to
            the RISK Payment Portal.
          </p>

          <div class="flex flex-wrap gap-2 mb-4">
            {Object.entries(INSTITUTION_MARKETS).map(([key, { name }]) => (
              <button
                type="button"
                key={key}
                onClick={() =>
                  handleInstitutionSelect(
                    key as "BANK" | "IMF" | "RISK" | "OFFSHORE",
                  )}
                class={`flex-1 p-2 rounded-md font-semibold text-sm transition-colors duration-200 min-w-[100px] ${
                  institution.value === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600 border border-gray-700"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {institution.value && (
            <p class="text-sm text-gray-400 mb-3">
              {INSTITUTION_MARKETS[institution.value]?.description}
            </p>
          )}

          {institution.value && (
            <>
              <label
                htmlFor="comment-select"
                class="block text-sm font-medium text-gray-300 mb-2"
              >
                Select a comment to award bounty:
              </label>
              {!apiKey.value && !isFetchingComments.value && (
                <p class="text-orange-400 text-sm mb-2">
                  Please enter your Manifold API key to fetch comments.
                </p>
              )}
              {isFetchingComments.value && (
                <p class="text-gray-400 text-sm">Loading comments...</p>
              )}
              {fetchCommentsError.value && (
                <p class="text-red-400 text-sm">{fetchCommentsError.value}</p>
              )}
              {/* Filtered comments message */}
              {!isFetchingComments.value && comments.value.length === 0 &&
                !fetchCommentsError.value && apiKey.value && (
                <p class="text-gray-400 text-sm">
                  No comments found for this institution's market.
                  {username.value && borrowerUserId.value === null
                    ? " (Could not verify borrower username for filtering, ensure API key is valid.)"
                    : (username.value && borrowerUserId.value
                      ? " (Filtered by borrower.)"
                      : "")}
                </p>
              )}
              {!isFetchingComments.value && comments.value.length > 0 && (
                <div class="max-h-60 overflow-y-auto border border-gray-700 rounded-md p-2 bg-gray-900">
                  {comments.value.map((comment) => (
                    <div
                      key={comment.id}
                      onClick={() => selectedCommentId.value = comment.id}
                      class={`p-2 my-1 cursor-pointer rounded-md transition-colors duration-150 ${
                        selectedCommentId.value === comment.id
                          ? "bg-blue-700 border border-blue-500"
                          : "bg-gray-700 hover:bg-gray-600 border border-gray-700"
                      }`}
                    >
                      <p class="text-gray-200 text-sm">
                        {stripHtml(
                          extractTextFromTipTapContent(comment.content.content),
                        ) ||
                          `[Comment without visible text - ID: ${comment.id}]`}
                      </p>
                      <p class="text-xs text-gray-400 mt-1">
                        Comment ID: {comment.id}{" "}
                        | User: @{comment.userUsername || comment.userId}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {selectedCommentId.value && (
                <p class="mt-2 text-sm text-green-400">
                  Selected Comment ID: {selectedCommentId.value}
                </p>
              )}
              <button
                type="button"
                onClick={handleConfirmBountyClick}
                disabled={isBountyButtonDisabled}
                class={`mt-4 w-full p-3 rounded-md text-lg font-semibold transition-colors duration-200 ${
                  isBountyButtonDisabled
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : (isConfirmingBounty.value
                      ? "bg-yellow-700 hover:bg-yellow-800 text-white"
                      : "bg-purple-600 hover:bg-purple-700 text-white")
                }`}
              >
                {bountyButtonText}
              </button>
              {/* Message display: only show if there's actual text and processing is NOT active */}
              {awardBountyMessage.value && !isProcessingPayment.value && (
                <p class="mt-2 text-center text-sm text-gray-200">
                  {awardBountyMessage.value}
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
