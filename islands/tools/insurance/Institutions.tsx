// islands/tools/insurance/Institutions.tsx
import { Signal, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { JSX } from "preact";
import {
  fetchUserData,
  getCommentsForContract,
} from "../../../utils/api/manifold_api_service.ts";
import {
  ManifoldComment,
  TipTapContentBlock,
} from "../../../utils/api/manifold_types.ts";
import { stripHtml } from "../../../utils/html_utils.ts";

interface InstitutionsProps {
  apiKey: Signal<string>;
  loanAmount: Signal<number>;
  username: Signal<string>;
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

const INSTITUTION_MARKETS: {
  [key: string]: { id: string; name: string; description: string };
} = {
  IMF: {
    id: "PdLcZARORc",
    name: "IMF",
    description: "Awards loan as bounty on the IMF market.",
  },
  BANK: {
    id: "tqQIAgd6EZ",
    name: "BANK",
    description: "Awards loan as bounty on the BANK market.",
  },
  RISK: {
    id: "QEytQ5ch0P",
    name: "RISK",
    description: "Awards loan as bounty on the RISK Payment Portal.",
  },
  OFFSHORE: {
    id: "CAQchupgyN",
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
    username,
    lenderUsername,
    insuranceFee,
    loanDueDate,
    selectedCoverage,
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
      const body = {
        apiKey: apiKey.value,
        borrowerUsername: username.value,
        lenderUsername: lenderUsername.value,
        loanAmount: loanAmount.value,
        coverage: selectedCoverage.value,
        dueDate: loanDueDate.value,
        institution: institution.value,
        commentId: selectedCommentId.value,
      };

      const response = await fetch("/api/v0/insurance/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "An unknown error occurred.");
      }

      awardBountyMessage.value =
        `✅ Successfully awarded M${loanAmount.value} bounty and paid insurance fee!`;
      awardBountyMessageType.value = "success";
      paymentMessage.value =
        `✅ Loan (via bounty) and insurance fee processed via ${institution.value} institution.`;
      paymentMessageType.value = "success";
      cooldownActive.value = true;
    } catch (error: unknown) {
      const errorMessage = typeof error === "object" && error !== null &&
          "message" in error
        ? (error as { message: string }).message
        : String(error);

      awardBountyMessage.value = `⛔ Error processing: ${errorMessage}`;
      awardBountyMessageType.value = "error";
      paymentMessage.value = `⛔ Payment failed: ${errorMessage}`;
      paymentMessageType.value = "error";
      cooldownActive.value = true;
    } finally {
      isProcessingPayment.value = false;
      isConfirmingBounty.value = false;
    }
  };

  const handleConfirmBountyClick = () => {
    awardBountyMessage.value = null;
    awardBountyMessageType.value = null;
    paymentMessage.value = "";
    paymentMessageType.value = "";
    cooldownMessage.value = "";

    if (cooldownActive.value) {
      awardBountyMessage.value = `⛔ ${cooldownMessage.value}`;
      awardBountyMessageType.value = "error";
      return;
    }

    if (
      !selectedCommentId.value || !apiKey.value || loanAmount.value <= 0 ||
      !username.value || !lenderUsername.value || !institution.value ||
      insuranceFee === null || insuranceFee < 0 || !loanDueDate.value ||
      selectedCoverage.value === null
    ) {
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
