export class FarsightRpcHttpError extends Error {
  public readonly status: number;
  public readonly responseText: string;

  public constructor(status: number, responseText: string) {
    super(`Farsight RPC request failed with status ${status}.`);
    this.name = "FarsightRpcHttpError";
    this.status = status;
    this.responseText = responseText;
  }
}
