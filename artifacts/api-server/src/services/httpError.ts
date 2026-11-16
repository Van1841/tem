// Route ko safe client-facing error aur HTTP status deta hai.
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly publicMessage: string,
  ) {
    super(publicMessage);
    this.name = "HttpError";
  }
}