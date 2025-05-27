// types.ts
export interface VisitStats {
  today: {
    totalVisits: number;
    uniqueVisits: number;
    newVisits: number;
  };
  posts: {
    totalPosts: number;
    newPosts: number;
    todayPosts: number;
  };
  subscribers: number;
}
