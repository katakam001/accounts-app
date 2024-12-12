export interface TrailBalanceReport {
    groupId: string;
    groupName: string;
    accountId: string | null;
    accountName: string | null;
    totalDebit: string;
    totalCredit: string;
    balance: string;
  }
  