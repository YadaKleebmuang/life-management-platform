type AuthErrorLike = {
  code?: unknown;
  message?: unknown;
};

export function getAuthErrorMessage(error: unknown): string {
  const authError = error as AuthErrorLike | null;
  const errorCode = typeof authError?.code === "string" ? authError.code : "";

  switch (errorCode) {
    case "auth/email-already-in-use":
      return "à¸­à¸µà¹€à¸¡à¸¥à¸™à¸µà¹‰à¸–à¸¹à¸à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¹à¸¥à¹‰à¸§ à¸à¸£à¸¸à¸“à¸²à¹ƒà¸Šà¹‰à¸­à¸µà¹€à¸¡à¸¥à¸­à¸·à¹ˆà¸™";
    case "auth/invalid-email":
      return "à¸£à¸¹à¸›à¹à¸šà¸šà¸­à¸µà¹€à¸¡à¸¥à¹„à¸¡à¹ˆà¸–à¸¹à¸à¸•à¹‰à¸­à¸‡";
    case "auth/weak-password":
      return "à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¸­à¹ˆà¸­à¸™à¹€à¸à¸´à¸™à¹„à¸› (à¸•à¹‰à¸­à¸‡à¸¡à¸µà¸­à¸¢à¹ˆà¸²à¸‡à¸™à¹‰à¸­à¸¢ 6 à¸•à¸±à¸§à¸­à¸±à¸à¸©à¸£)";
    case "auth/user-not-found":
      return "à¹„à¸¡à¹ˆà¸žà¸šà¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸™à¸µà¹‰à¹ƒà¸™à¸£à¸°à¸šà¸š";
    case "auth/wrong-password":
      return "à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹„à¸¡à¹ˆà¸–à¸¹à¸à¸•à¹‰à¸­à¸‡";
    case "auth/invalid-credential":
      return "à¸­à¸µà¹€à¸¡à¸¥à¸«à¸£à¸·à¸­à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹„à¸¡à¹ˆà¸–à¸¹à¸à¸•à¹‰à¸­à¸‡";
    case "auth/network-request-failed":
      return "à¸à¸²à¸£à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­à¹€à¸„à¸£à¸·à¸­à¸‚à¹ˆà¸²à¸¢à¸¥à¹‰à¸¡à¹€à¸«à¸¥à¸§ à¸à¸£à¸¸à¸“à¸²à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸­à¸´à¸™à¹€à¸—à¸­à¸£à¹Œà¹€à¸™à¹‡à¸•à¸‚à¸­à¸‡à¸„à¸¸à¸“";
    case "auth/too-many-requests":
      return "à¸žà¸¢à¸²à¸¢à¸²à¸¡à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸šà¸šà¹ˆà¸­à¸¢à¹€à¸à¸´à¸™à¹„à¸› à¸à¸£à¸¸à¸“à¸²à¸£à¸­à¸ªà¸±à¸à¸„à¸£à¸¹à¹ˆà¹à¸¥à¹‰à¸§à¸¥à¸­à¸‡à¹ƒà¸«à¸¡à¹ˆ";
    default:
      if (typeof authError?.message === "string") {
        return authError.message;
      }
      return "à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¸”à¸³à¹€à¸™à¸´à¸™à¸à¸²à¸£ à¸à¸£à¸¸à¸“à¸²à¸¥à¸­à¸‡à¹ƒà¸«à¸¡à¹ˆà¸­à¸µà¸à¸„à¸£à¸±à¹‰à¸‡";
  }
}
