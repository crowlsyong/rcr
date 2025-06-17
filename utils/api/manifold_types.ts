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

export interface ManifoldMarket {
  id: string;
  question: string;
  slug: string;
  url: string;
  probability: number;
  outcomeType: "BINARY" | "FREE_RESPONSE" | "PSEUDO_NUMERIC";
  pool: {
    YES: number;
    NO: number;
  };
  totalLiquidity: number;
  volume: number;
}

export interface MarketData extends ManifoldMarket {}
