export {};

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      user?: {
        id: number;
        email: string;
        roleId: number;
        role: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}