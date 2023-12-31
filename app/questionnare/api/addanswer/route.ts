import prisma from "../../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
	try {
		const requestText = await request.text();
		const requestBody = JSON.parse(requestText);

		const newUuid = uuidv4();

		await prisma.$queryRaw`INSERT INTO answer (answerID, questionId, answerDescription, answerExplanation, isCorrect) VALUES (${newUuid}, ${requestBody.questionID}, ${requestBody.answer}, ${requestBody.explanation}, ${requestBody.isCorrect})`;

		return new Response(
			JSON.stringify({
				data: null,
				status: 201,
			})
		);
	} catch (e) {
		console.log(e);
		return new Response(
			JSON.stringify({
				data: null,
				status: 501,
			})
		);
	}
}
