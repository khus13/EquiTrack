<?php
/**
 * helpers/Validator.php
 * Declarative validation.  Example:
 *     $errors = Validator::check($data, [
 *         'email'    => 'required|email|max:190',
 *         'password' => 'required|min:8',
 *         'priority' => 'required|in:Low,Medium,High,Urgent',
 *     ]);
 * Returns an array like ['email' => 'Enter a valid e-mail address.'] (empty = valid).
 * Only the FIRST failing rule per field is reported.
 */
class Validator
{
    public static function check(array $data, array $rules): array
    {
        $errors = [];
        foreach ($rules as $field => $ruleString) {
            $value    = $data[$field] ?? null;
            $label    = ucfirst(str_replace('_', ' ', preg_replace('/_id$/', '', $field)));
            $required = false;

            foreach (explode('|', $ruleString) as $rule) {
                [$name, $arg] = array_pad(explode(':', $rule, 2), 2, null);
                $empty = $value === null || (is_string($value) && trim($value) === '');

                if ($name === 'required') {
                    $required = true;
                    if ($empty) { $errors[$field] = "$label is required."; break; }
                    continue;
                }
                if ($empty) {            // optional + empty -> skip the other rules
                    break;
                }

                $msg = match ($name) {
                    'email'   => filter_var($value, FILTER_VALIDATE_EMAIL) ? null : 'Enter a valid e-mail address.',
                    'min'     => mb_strlen((string) $value) >= (int) $arg ? null : "$label must be at least $arg characters.",
                    'max'     => mb_strlen((string) $value) <= (int) $arg ? null : "$label must be at most $arg characters.",
                    'int'     => filter_var($value, FILTER_VALIDATE_INT) !== false ? null : "$label must be a whole number.",
                    'in'      => in_array((string) $value, explode(',', (string) $arg), true) ? null : "$label has an invalid value.",
                    'letters' => preg_match('/^[\p{L}\p{M}\s\'.\-]+$/u', (string) $value) ? null : "$label contains invalid characters.",
                    default   => null,
                };
                if ($msg !== null) { $errors[$field] = $msg; break; }
            }
        }
        return $errors;
    }

    /**
     * Clean a text input: trim, remove HTML tags and control characters.
     * (React also escapes output, so this is "defence in depth".)
     */
    public static function clean($value): string
    {
        $value = is_scalar($value) ? (string) $value : '';
        $value = strip_tags($value);
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
        return trim($value);
    }

    /** Password rule: 8+ characters with at least one letter and one number. */
    public static function passwordError(string $password): ?string
    {
        if (mb_strlen($password) < config('auth.min_password')) {
            return 'Password must be at least ' . config('auth.min_password') . ' characters.';
        }
        if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
            return 'Password must contain at least one letter and one number.';
        }
        return null;
    }
}
