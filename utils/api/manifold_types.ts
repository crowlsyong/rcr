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
  creatorId: string;
  creatorUsername: string;
  creatorName: string;
  createdTime: number;
  creatorAvatarUrl?: string | null;
  closeTime?: number | null;
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
  isResolved?: boolean;
  resolution?: string;
  resolutionTime?: number;
  resolutionProbability?: number;
  uniqueBettorCount?: number;
  lastUpdatedTime?: number;
  lastBetTime?: number;
  lastCommentTime?: number;
  token?: string;
  description?: string;
  groupSlugs?: string[];
  textDescription?: string;
  mechanism?: string;
  p?: number;
}

export interface MarketData extends ManifoldMarket {}

// UPDATED ContractMetric interface
export type ContractMetric = {
  contractId: string;
  from?: { // Marking as optional, and detailing structure
    [period: string]: {
      profit: number;
      profitPercent: number;
      invested: number;
      prevValue: number;
      value: number;
    };
  };
  loan?: number; // Marking optional
  payout?: number; // Marking optional
  profit?: number; // Marking optional
  userId: string;
  answerId?: string | null; // Marking optional and allowing null
  invested: number; // This is the old 'invested' field
  lastProb?: number | null; // Marking optional and allowing null
  hasShares: boolean;
  totalSpent?: { // Marking optional
    NO?: number;
    YES?: number;
  };
  hasNoShares: boolean;
  lastBetTime?: number; // Marking optional
  totalShares?: { // Marking optional
    NO: number;
    YES: number;
    // Potentially other answer IDs
    [key: string]: number; // Allow dynamic keys for totalShares
  };
  hasYesShares: boolean;
  profitPercent?: number; // Marking optional
  userUsername?: string; // Marking optional to match behavior, though usually present
  userName?: string; // Marking optional
  userAvatarUrl?: string | null; // Marking optional
  totalAmountSold?: number; // <-- ADDED THIS
  maxSharesOutcome?: string | null; // Marking optional
  totalAmountInvested?: number; // <-- ADDED THIS (This is the one causing the error!)
  isRanked?: boolean; // <-- ADDED THIS
  previousProfit?: number; // <-- ADDED THIS (from example)
};

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

export interface TipTapContentBlock {
  type: string;
  text?: string;
  content?: TipTapContentBlock[];
  attrs?: {
    id?: string;
    label?: string;
    href?: string;
  };
}

export interface ManifoldComment {
  id: string;
  isApi?: boolean;
  userId: string;
  content: {
    type: "doc";
    content: TipTapContentBlock[];
  };
  userName?: string;
  contractId: string;
  visibility?: "public" | string;
  commentType?: "contract" | string;
  createdTime: number;
  contractSlug?: string;
  userUsername?: string;
  userAvatarUrl?: string;
  contractQuestion?: string;
  replyToCommentId?: string;
  likes?: number;
}

export interface ManagramApiResponse {
  status: "success" | "error";
  message: string;
}
