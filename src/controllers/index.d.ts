// This file uses declaration merging to add a custom 'user' property to the Express Request interface.
// This allows TypeScript to recognize req.user without causing compilation errors.

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}
