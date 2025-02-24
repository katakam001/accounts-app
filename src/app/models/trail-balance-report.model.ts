export interface TrailBalanceReport {
    groupId: number;
    groupName: string;
    accountId: number | null;
    accountName: string | null;
    totalDebit: string;
    totalCredit: string;
    balance: string;
  }
  