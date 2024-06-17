import { ChatOpenAI } from "@langchain/openai";
import { uploadToSupabase } from "@/lib/hooks/uploadToSupabase";
import { NextResponse, NextRequest } from "next/server";
import { reduceUserCredits } from "@/lib/hooks/reduceUserCredits";

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const toolPath = decodeURIComponent(requestBody.toolPath);

    // Dynamically import the toolConfig, prompt and functionCall based on the tool name
    const { toolConfig } = await import(`@/app/${toolPath}/toolConfig`);
    const { generatePrompt } = await import(`@/app/${toolPath}/prompt`);
    const { functionSchema } = await import(`@/app/${toolPath}/schema`);

    // Generate prompt & function call
    const prompt = generatePrompt(requestBody);
    const functionCall = functionSchema[0];

    // Initialize LangChain's OpenAI
    const openAI = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: toolConfig.aiModel,
    });

    const chatWithStructuredOutput = openAI.withStructuredOutput(functionCall);

    const responseData = await chatWithStructuredOutput.invoke([
      ["system", String(toolConfig.systemMessage)],
      ["human", String(prompt)],
    ]);

    console.log("Response from GPT:", responseData);

    // Store the response in generations table
    const supabaseResponse = await uploadToSupabase(
      requestBody,
      responseData,
      toolConfig.toolPath,
      toolConfig.aiModel
    );

    // If paywall is enabled, reduce user credits
    if (toolConfig.paywall === true) {
      await reduceUserCredits(requestBody.email, toolConfig.credits);
    }

    return new NextResponse(
      JSON.stringify({
        id: supabaseResponse[0].id,
      }),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(
        JSON.stringify({ status: "Error", message: error.message }),
        { status: 500 }
      );
    } else {
      console.error(error);
      return new NextResponse(
        JSON.stringify({
          status: "Error",
          message: "An unknown error occurred",
        }),
        { status: 500 }
      );
    }
  }
}
