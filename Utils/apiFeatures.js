const { log } = require("console");
const qs = require("qs");
class ApiFeatures {
  constructor(query, queryStr) {
    (this.query = query), (this.queryStr = queryStr);
  }

  filter() {
    // 1. Create a shallow copy of req.query to avoid modifying the original

    const queryObj = { ...this.queryStr };

    // 2. Exclude special field names from filtering
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((field) => delete queryObj[field]);
    // console.log(queryObj);

    // 3. Advanced filtering for gte, gt, lte, lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // console.log(queryStr);

    // Start building the query
    this.query = this.query.find(qs.parse(JSON.parse(queryStr)));

    return this;
  }

  sort() {
    // 4. Sorting
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt"); // Default sorting
    }
    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v"); // Exclude __v field by default
    }
    return this;
  }

  pagination() {
    // 6. Pagination
    const page = parseInt(this.queryStr.page) || 1;
    const limit = parseInt(this.queryStr.limit) || 0;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    // Check if page exists
    // if (req.query.page) {
    //   const moviesCount = await Movie.countDocuments();
    //   if (skip >= moviesCount) {
    //     throw new Error("This page does not exist");
    //   }
    // }
    return this;
  }
}

module.exports = ApiFeatures;
