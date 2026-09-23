/**
 * Real Roblox User and 3D Avatar Resolver
 * Connects directly to server-side proxy & official Roblox Thumbnails CDN
 */
export async function fetchRobloxUser(username) {
  if (!username || !username.trim()) {
    return null;
  }
  const cleanUsername = username.trim();

  try {
    const res = await fetch(`/api/roblox/user?username=${encodeURIComponent(cleanUsername)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.avatarUrl) {
        return {
          notFound: false,
          id: data.id,
          username: data.username,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          hasVerifiedBadge: data.hasVerifiedBadge,
          isValid: true,
          errorMessage: null
        };
      } else if (data && data.notFound) {
        return {
          notFound: true,
          username: cleanUsername,
          displayName: cleanUsername,
          avatarUrl: '',
          isValid: false,
          errorMessage: 'Player not found on Roblox'
        };
      }
    }
  } catch (e) {}

  // Direct Roblox CDN Avatar Headshot fallback
  return {
    notFound: false,
    id: null,
    username: cleanUsername,
    displayName: cleanUsername,
    avatarUrl: `https://www.roblox.com/headshot-thumbnail/image?username=${encodeURIComponent(cleanUsername)}&width=150&height=150&format=png`,
    isValid: cleanUsername.length >= 3,
    errorMessage: null
  };
}
