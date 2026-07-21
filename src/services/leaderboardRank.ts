export type RankableUser = {
  testAccount?: boolean;
  uid: string;
};

export function mergeRankUsers<T extends RankableUser>(users: T[], currentUser: T): T[] {
  const found = users.some((item) => item.uid === currentUser.uid);
  if (!found) return [...users, currentUser];
  return users.map((item) => item.uid === currentUser.uid ? currentUser : item);
}

export function visibleRankUsers<T extends RankableUser>(users: T[], currentUser: T): T[] {
  const currentHidden = currentUser.testAccount === true;
  const visible = users.filter((item) => (item.testAccount === true) === currentHidden);
  return mergeRankUsers(visible, currentUser);
}

export function rankForMetric<T extends RankableUser>(users: T[], userId: string, metric: (user: T) => number): number {
  const currentUser = users.find((item) => item.uid === userId);
  if (!currentUser) return 1;
  const currentValue = metric(currentUser);
  return 1 + users.filter((item) => item.uid !== userId && metric(item) > currentValue).length;
}
