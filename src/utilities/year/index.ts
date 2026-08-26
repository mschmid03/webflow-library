import { defineUtility } from '../../core';

export default defineUtility({
  name: 'year',
  roles: {
    root: {},
  },
  options: {},
  init({ root }) {
    root.textContent = String(new Date().getFullYear());
  },
});
