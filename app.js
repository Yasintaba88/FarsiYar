
function errorText(err) {
  const message = String(
    err?.message ||
    err?.details ||
    err?.hint ||
    (typeof err === 'string' ? err : '') ||
    'خطای نامشخص'
  );

  const m = message.toLowerCase();

  if (!navigator.onLine) {
    return 'اینترنت قطع است. اتصال اینترنت را بررسی کنید.';
  }

  if (m.includes('invalid login credentials')) {
    return 'ایمیل یا رمز عبور اشتباه است.';
  }

  if (m.includes('email not confirmed')) {
    return 'ایمیل این حساب هنوز تأیید نشده است.';
  }

  if (m.includes('invalid api key') ||
      m.includes('apikey') ||
      m.includes('jwt')) {
    return 'کلید اتصال Supabase نامعتبر است. تنظیمات اتصال را بررسی کنید.';
  }

  if (m.includes('permission') ||
      m.includes('row-level security') ||
      m.includes('row-level')) {
    return 'خطای دسترسی دیتابیس: ' + message;
  }

  if (
    m.includes('relation') ||
    m.includes('does not exist') ||
    m.includes('schema cache') ||
    m.includes('could not find the function') ||
    m.includes('function') ||
    m.includes('column')
  ) {
    return 'خطای واقعی دیتابیس فارسی‌یار: ' + message;
  }

  return 'خطای اتصال یا سرویس: ' + message;
}
