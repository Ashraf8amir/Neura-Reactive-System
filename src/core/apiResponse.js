class ApiResponse {
  constructor(res, statusCode, statusText, message, data = null, meta = null) {
    this.res = res;
    this.statusCode = statusCode;
    this.statusText = statusText;
    this.message = message;
    this.data = data;
    this.meta = meta;

    this.send();
  }

  send() {
    const response = {
      status: this.statusText,
      message: this.message,
      data: this.data,
      meta: this.meta,
    };
    this.res.status(this.statusCode).json(response);
  }
}

module.exports = ApiResponse;