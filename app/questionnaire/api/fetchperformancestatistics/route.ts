import { error } from "console";
import prisma from "../../../lib/prisma";
import { PythonShell } from "python-shell";

async function getCategoryID(categoryName: string): Promise<string | null> {
	try {
		let category: {
			categoryID: string;
		}[] =
			await prisma.$queryRaw`SELECT BIN_TO_UUID(categoryID) AS categoryID FROM taxonomyCategory WHERE name = ${categoryName}`;

		if (category.length !== 1)
			throw new Error("Something went wrong during categoryID fetch.");

		return category[0].categoryID;
	} catch (e) {
		console.log(e);
		return null;
	}
}

async function updateStudentKnowledge(
	studentID: string,
	topicID: string,
	knowledgeData: any
) {
	try {
		for (const categoryName in knowledgeData) {
			const parameters = parameterData[categoryName];
			const studentId = // ... get the studentId associated with this data
				await updateStudentKnowledge(
					categoryName,
					parameters,
					studentId
				);
		}
	} catch (e) {
		console.log(e);
	}
}

export async function POST() {
	try {
		let statistics: {
			isCorrect: number;
			categoryName: string;
		}[] =
			await prisma.$queryRaw`SELECT statistic.isCorrect AS isCorrect, taxonomyCategory.name AS categoryName
									FROM statistic
									JOIN question ON statistic.questionID = question.questionID
									JOIN taxonomyCategory ON question.categoryID = taxonomyCategory.categoryID
									WHERE question.topicID = UUID_TO_BIN('ca66e94f-8b3b-47bf-b23b-a374e2d439af');`;

		if (statistics.length === 0) throw new Error("No statistics returned");

		console.info(statistics);

		interface SQLQueryResultItem {
			isCorrect: number;
			categoryName: string;
		}

		interface StudentData {
			[categoryName: string]: number[];
		}

		const student_data: StudentData = {};

		// Process the SQL query output
		statistics.forEach((item: SQLQueryResultItem) => {
			const { categoryName, isCorrect } = item;

			if (!student_data[categoryName]) {
				student_data[categoryName] = [];
			}

			student_data[categoryName].push(isCorrect);
		});

		console.log(student_data);

		let maxLength = 0;
		for (const categoryName in student_data) {
			maxLength = Math.max(maxLength, student_data[categoryName].length);
		}

		// Pad shorter arrays with null
		for (const categoryName in student_data) {
			const currentLength = student_data[categoryName].length;
			if (currentLength < maxLength) {
				const paddingNeeded = maxLength - currentLength;
				student_data[categoryName] = [
					...student_data[categoryName],
					...Array(paddingNeeded).fill(null),
				];
			}
		}

		student_data["Applying"][2] = 1;
		console.log(student_data);

		const options = {
			pythonOptions: ["-u"],
			args: [JSON.stringify(student_data)],
		};

		PythonShell.run(
			"./app/questionnaire/api/irt_analysis.py",
			options
		).then((messages) => {
			const parameterData: ParameterData[] = JSON.parse(messages[0]);
			console.log("IRT Difficulty Values: ", parameterData);

			interface ParameterData {
				a: number;
				b: number;
				g: number;
				u: number;
			}

			const results: Record<string, ParameterData> = {};

			const categories = Object.keys(student_data);

			for (let i = 0; i < categories.length; i++) {
				const categoryName = categories[i];
				results[categoryName] = parameterData[i];
			}

			console.log(results);
			updateStudentKnowledge(
				"5c2b1687-0a98-49e9-af03-621cd8d4d0eb",
				"ca66e94f-8b3b-47bf-b23b-a374e2d439af",
				results
			);
		});

		return new Response(
			JSON.stringify({
				data: null,
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
