const validator = require("validator");

// const validateSignUpdata = (req) => {
//   const { firstName, lastName, emailId, password } = req.body;

//   if (!firstName || !lastName) {
//     throw new Error("Name is not valid");
//   } else if (!validator.isEmail(emailId)) {
//     throw new Error("email is not valid");
//     //   } else if (!validator.isStrongPassword(password)) {
//     //     throw new Error("please enter strong password");
//   }
// };

const ValidateProfileEdit = (req) => {
  const allowedEditFields = [
    "email",
    role,
    profilePicture,
    bio,
    skills,
    programmingLanguages,
    university,
    yearOfStudy,
    isActive,
    lastLogin,
    emailVerified,
  ];
  //we will loop through this req  body
  const isEditAllowed = Object.keys(req.body).every((field) =>
    allowedEditFields.includes(field)
  );
  //   console.log(isEditAllowed);

  return isEditAllowed;
};

module.exports = { ValidateProfileEdit };
