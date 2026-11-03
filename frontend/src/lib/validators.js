/**
 * lib/validators.js
 * Client-side form checks (instant feedback). The server repeats every check,
 * so these are for convenience, not for security.
 * Each function returns an object like { email: 'Enter a valid e-mail.' } (empty = valid).
 */
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from './constants.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const passwordProblem = (pw) => {
  if (!pw || pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Use at least one letter and one number.';
  return null;
};

export function validateLogin(v) {
  const e = {};
  if (!v.email.trim()) e.email = 'E-mail is required.';
  else if (!EMAIL.test(v.email.trim())) e.email = 'Enter a valid e-mail address.';
  if (!v.password) e.password = 'Password is required.';
  return e;
}

export function validateRegister(v) {
  const e = {};
  if (!v.first_name.trim()) e.first_name = 'First name is required.';
  if (!v.last_name.trim()) e.last_name = 'Last name is required.';
  if (!v.email.trim()) e.email = 'E-mail is required.';
  else if (!EMAIL.test(v.email.trim())) e.email = 'Enter a valid e-mail address.';
  const p = passwordProblem(v.password);
  if (p) e.password = p;
  if (v.confirm_password !== v.password) e.confirm_password = 'Passwords do not match.';
  return e;
}

export function validateProfile(v) {
  const e = {};
  if (!v.first_name.trim()) e.first_name = 'First name is required.';
  if (!v.last_name.trim()) e.last_name = 'Last name is required.';
  if (!v.email.trim()) e.email = 'E-mail is required.';
  else if (!EMAIL.test(v.email.trim())) e.email = 'Enter a valid e-mail address.';
  return e;
}

export function validatePasswordChange(v) {
  const e = {};
  if (!v.current_password) e.current_password = 'Enter your current password.';
  const p = passwordProblem(v.new_password);
  if (p) e.new_password = p;
  if (v.confirm_password !== v.new_password) e.confirm_password = 'Passwords do not match.';
  return e;
}

/** Returns an error message for a chosen image file, or null when OK. */
export function imageProblem(file) {
  if (!file) return null;
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Only JPG or PNG images are accepted.';
  if (file.size > MAX_UPLOAD_BYTES) return 'Image must be 2 MB or smaller.';
  return null;
}

export function validateReport(v, photo) {
  const e = {};
  if (!v.item_name.trim()) e.item_name = 'Name of the item is required.';
  else if (v.item_name.trim().length > 150) e.item_name = 'Keep the name under 150 characters.';
  if (!v.category_id) e.category_id = 'Select a category.';
  if (!v.campus_id) e.campus_id = 'Select a campus.';
  if (!v.building_id) e.building_id = 'Select a building.';
  if (!v.room_id) e.room_id = 'Select the room / location.';
  if (!v.damage_type_id) e.damage_type_id = 'Select the type of damage.';
  if (!v.priority) e.priority = 'Select a priority.';
  if (!v.description.trim()) e.description = 'Please describe the problem.';
  else if (v.description.trim().length < 10) e.description = 'Add a little more detail (at least 10 characters).';
  const img = imageProblem(photo);
  if (img) e.photo = img;
  return e;
}
