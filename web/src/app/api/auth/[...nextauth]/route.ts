import NextAuth from "next-auth";

const handler = NextAuth({
  providers: [],
  secret: "mock-secret-for-mvp-only",
});

export { handler as GET, handler as POST };
