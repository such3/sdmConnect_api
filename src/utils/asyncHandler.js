const asyncHandler = (requestHandler) => {
  req,
    res,
    (next) => {
      Promise.resolve(requestHandler(req, res, next)).catch((error) => {
        console.error("ERROR : ", error);
        next(error);
      });
    };
};

export default asyncHandler;
