const tests = {
  1: { id: 'ID-1', isEnabled: false },
  2: { id: 'ID-2', isEnabled: true },
  3: { id: 'ID-3', isEnabled: true },
  4: { id: 'ID-4', isEnabled: true },
  5: { id: 'ID-5', isEnabled: false },
  6: { id: 'ID-6', isEnabled: true },
};
// TODO: add test names to the backend.


export function extractTestIDs(description: string): string[] {
  // Regular expression to match ID patterns like 'ID-1', 'ID-2', etc.
  const regex = /ID-\d+/g;
  // Match all occurrences and return as an array
  const matches = description.match(regex);
  // If there are no matches, return an empty array
  return matches || [];
  // TODO: add test names to the backend after :
}

export async function areTestsEnabled(testIds: string[]): Promise<boolean[]> {
  return testIds.map(id => {
    // Find the test with the given id
    const test = Object.values(tests).find(test => test.id === id);

    // Return true if the test is found and isEnabled is true, otherwise false
    return test ? test.isEnabled : false;
  })
};