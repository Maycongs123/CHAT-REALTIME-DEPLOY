// Recursividade
function createCode(chars = '') {
  const letters = 'abcdefghijlmnopqrstuvwxyz';
  const upperCaseLetters = 'ABCDEFGHIJLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '!@#$%&*()';

  return {
    withLetters() {
      return createCode((chars += letters));
    },
    withUpperLetters() {
      return createCode((chars += upperCaseLetters));
    },
    withNumbers() {
      return createCode((chars += numbers));
    },
    withSpecialChars() {
      return createCode((chars += specialChars));
    },
    create(size = 6) {
      let code = '';

      for (let i = 0; i < size; i++) {
        const index = Math.floor(Math.random() * chars.length);
        code += chars[index];
      }
      return code;
    },
  };
}

module.exports = createCode;
