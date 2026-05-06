export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  error?: ErrorDetail;
};

export type ErrorDetail = {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
};

export const success = <T>(data: T, message = "Success"): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

export const error = (
  message: string,
  code: string = "ERROR",
  field?: string,
  details?: Record<string, unknown>,
): ApiResponse => ({
  success: false,
  message,
  error: {
    code,
    message,
    field,
    details,
  },
});
