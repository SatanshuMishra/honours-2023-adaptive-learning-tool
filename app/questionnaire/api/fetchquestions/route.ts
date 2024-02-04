import Question from "@/app/types/question";
import prisma from "../../../lib/prisma";

export async function POST() {
	try {
		let questions: [Question[]] =
			await prisma.$queryRaw`SELECT * FROM question ORDER BY RAND() LIMIT 20`;

		if (questions.length > 20)
			throw new Error("Too many questions generated!");

		return new Response(
			JSON.stringify({
				data: questions,
				status: 200,
			})
		);
	} catch (e) {
		console.log(e);
		return new Response(
			JSON.stringify({
				data: null,
				status: 400,
			})
		);
	}
}