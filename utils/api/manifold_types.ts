// utils/api/manifold_types.ts

export interface ManaPaymentTransaction {
  id: string;
  amount: number;
  fromId: string;
  toId: string;
  fromType: "USER" | string;
  toType: "USER" | string;
  category: "MANA_PAYMENT" | string;
  createdTime: number;
  token?: string;
  description?: string;
  data?: {
    groupId?: string;
    message?: string;
    visibility?: string;
  };
}

export interface UserPortfolio {
  loanTotal: number;
  investmentValue: number;
  cashInvestmentValue: number;
  balance: number;
  cashBalance: number;
  spiceBalance: number;
  totalDeposits: number;
  totalCashDeposits: number;
  dailyProfit: number;
  timestamp: number;
}

export interface ManifoldUser {
  id: string;
  username: string;
  avatarUrl?: string | null;
  createdTime?: number;
  userDeleted?: boolean;
}

export interface Answer {
  id: string;
  contractId: string;
  text: string;
  probability: number;
  pool: {
    YES: number;
    NO: number;
  };
  index: number;
  userId: string;
  createdTime: number;
  isOther?: boolean;
}

export interface ManifoldMarket {
  id: string;
  question: string;
  slug: string;
  url: string;
  outcomeType:
    | "BINARY"
    | "MULTIPLE_CHOICE"
    | "FREE_RESPONSE"
    | "PSEUDO_NUMERIC";
  volume: number;
  totalLiquidity: number;
  probability?: number;
  pool?: {
    YES: number;
    NO: number;
  };
  answers?: Answer[];
}

export interface MarketData extends ManifoldMarket {}

export interface BetPayload {
  amount: number;
  contractId: string;
  outcome: "YES" | "NO";
  limitProb?: number;
  answerId?: string;
  expiresMillisAfter?: number;
  expiresAt?: number;
}

export interface ManifoldBetResponse {
  id: string;
  userId: string;
  contractId: string;
  createdTime: number;
  amount: number;
  outcome: "YES" | "NO";
  shares: number;
  probBefore: number;
  probAfter: number;
  isFilled: boolean;
  isCancelled: boolean;
}

// Defining the nested content structure for Manifold Comments (BlockJSON / TipTap)
export interface TipTapContentBlock {
  type: string;
  text?: string; // For paragraph, heading etc.
  content?: TipTapContentBlock[]; // For nested structures like doc, paragraph, mention
  attrs?: { // For attributes like mention, link. More specific attrs can be added if needed.
    id?: string;
    label?: string;
    href?: string;
    // Add other TipTap attrs here as needed, e.g., 'level' for headings
  };
}

// Updated interface for Manifold Comment response
export interface ManifoldComment {
  id: string;
  isApi?: boolean; // Added based on your provided API response
  userId: string;
  // This is the crucial change: 'content' is an object with a 'type' and a 'content' array
  content: {
    type: "doc";
    content: TipTapContentBlock[];
  };
  userName?: string; // Added from API response
  contractId: string;
  visibility?: "public" | string; // Added from API response
  commentType?: "contract" | string; // Added from API response
  createdTime: number;
  contractSlug?: string; // Added from API response
  userUsername?: string; // Added from API response
  userAvatarUrl?: string; // Added from API response
  contractQuestion?: string; // Added from API response
  replyToCommentId?: string;
  likes?: number; // Added from API response
}

export interface ManagramApiResponse {
  status: "success" | "error";
  message: string;
}
