// utils/github.ts
interface GitHubUser {
  login: string;
  // id: number; // Add if needed
  // name: string | null; // Add if needed
  // avatar_url: string; // Add if needed
}

export async function getAuthenticatedUser(
  accessToken: string,
): Promise<GitHubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch GitHub user: ${response.status} ${errorText}`,
    );
  }

  const user = await response.json();
  return user as GitHubUser;
}
