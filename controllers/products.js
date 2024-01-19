const Product = require('../models/product');

const getAllProductsStatic = async (req, res) => {
  const products = await Product.find({ price: { $gt: 30 } })  // This line uses the Product model to find all products in the database where the price is greater than 30. It returns a list of products.
    .sort('price')         // This line chains sorting and selecting methods to the query. It sorts the products by price in ascending order and selects only the name and price fields.
    .select('name price');

  res.status(200).json({ products, nbHits: products.length });  // This line sends a JSON response to the client with the list of products and the count of products (nbHits). The HTTP status code 200 indicates a successful request.
};
const getAllProducts = async (req, res) => {
  const { featured, company, name, sort, fields, numericFilters } = req.query;  // This line destructures the query parameters from the request URL. It extracts values for featured, company, name, sort, fields, and numericFilters from the req.query object.
  const queryObject = {};  // This line initializes an empty object named queryObject which will be used to construct the MongoDB query based on the provided parameters.

  if (featured) {
    queryObject.featured = featured === 'true' ? true : false;      // This line checks if the featured parameter exists. If it does, it sets the featured property in the queryObject to true if the value is 'true', otherwise, it sets it to false.
  }
  if (company) {
    queryObject.company = company;  // This line checks if the company parameter exists. If it does, it sets the company property in the queryObject to the provided value.
  }
  if (name) {            // This line checks if the name parameter exists. If it does, it sets the name property in the queryObject to a regular expression that performs a case-insensitive search for the provided name.
    queryObject.name = { $regex: name, $options: 'i' };
  }
  if (numericFilters) {                // This block handles numeric filters, transforming them into MongoDB query conditions. It uses a regular expression (regEx) to replace certain operators and then processes the filters to add conditions to the queryObject.
    const operatorMap = {
      '>': '$gt',
      '>=': '$gte',
      '=': '$eq',
      '<': '$lt',
      '<=': '$lte',
    };
    const regEx = /\b(<|>|>=|=|<|<=)\b/g;  // This line creates a regular expression (regEx) to match certain operators (such as <, >, >=, =, <=). The \b ensures that the match is a whole word, preventing partial matches.
    let filters = numericFilters.replace(
      regEx,
      (match) => `-${operatorMap[match]}-`    // This line uses the regular expression to replace the matched operators in the numericFilters string with their corresponding values from the operatorMap. For example, if it finds <, it replaces it with - $lt -.
    );
    const options = ['price', 'rating'];    // This line creates an array named options containing strings 'price' and 'rating'. These strings represent the fields for which numeric filters will be applied.
    filters = filters.split(',').forEach((item) => {                 // This block processes the modified filters string. It splits the string into an array based on commas (,), then iterates over each item using the forEach method.
      const [field, operator, value] = item.split('-');     // const [field, operator, value] = item.split('-');: This line splits each item based on hyphens (-) and assigns the resulting parts to variables field, operator, and value. For example, if the item is -price->30-, it becomes ['price', '>', '30'].
      if (options.includes(field)) {                // if (options.includes(field)) {: This line checks if the field (e.g., 'price') is one of the options ('price' or 'rating'). If true, it proceeds to the next line.
        queryObject[field] = { [operator]: Number(value) };
      }
    });
  }

  let result = Product.find(queryObject);
  // sort
  if (sort) {
    const sortList = sort.split(',').join(' ');
    result = result.sort(sortList);
  } else {
    result = result.sort('createdAt');
  }

  if (fields) {
    const fieldsList = fields.split(',').join(' ');
    result = result.select(fieldsList);
  }
  const page = Number(req.query.page) || 1;           // These lines set default values for pagination parameters (page and limit) and calculate the value of skip (how many documents to skip). This line retrieves the value of the page parameter from the query string of the HTTP request (req.query.page). The Number() function is used to convert the value to a numeric type. If the conversion results in a falsy value (like null, undefined, or 0), the || (logical OR) operator sets a default value of 1 for page. This line ensures that page is always a positive integer with a default value of 1.
  const limit = Number(req.query.limit) || 10;    // Similar to the first line, this retrieves the value of the limit parameter from the query string, converts it to a numeric type, and sets a default value of 10 if the conversion results in a falsy value. This line ensures that limit is always a positive integer with a default value of 10.
  const skip = (page - 1) * limit;  // This line calculates the number of documents to skip (skip) based on the requested page. It subtracts 1 from the page value (because page numbering typically starts from 1) and multiplies the result by the limit. This calculation is used to determine the starting point of the documents to retrieve for the current page.

  result = result.skip(skip).limit(limit);   // It applies pagination to the result by skipping a certain number of documents and limiting the number of documents in the response.  This line modifies the result variable, presumably representing a database query result, by applying pagination. The skip(skip) method is used to skip the calculated number of documents, and the limit(limit) method is used to restrict the number of documents returned to the specified limit. These methods together create a paginated result set that corresponds to the requested page and limit.
  // 23
  // 4 7 7 7 2

  const products = await result;
  res.status(200).json({ products, nbHits: products.length });
};

module.exports = {
  getAllProducts,
  getAllProductsStatic,
};
