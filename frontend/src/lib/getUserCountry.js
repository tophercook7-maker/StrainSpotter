export async function getUserCountry() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code || 'US';
  } catch (error) {
    console.error('Failed to detect country', error);
    return 'US';
  }
}
