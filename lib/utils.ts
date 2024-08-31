export function extractTestIDs(description: string): string[] {
  // Regular expression to match ID patterns like 'ID-1', 'ID-2', etc.
  const regex = /ID-\d+/g;
  // Match all occurrences and return as an array
  const matches = description.match(regex);
  // If there are no matches, return an empty array
  return matches || [];
}