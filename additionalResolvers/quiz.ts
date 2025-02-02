import { Resolvers } from "../.mesh";
import { AssessmentItemType, CallbackAfterAssessmentMutation, handleAssessmentMutationThenCallback } from "./lib";

export enum QuestionTypes {
    MultipleChoice = "MultipleChoiceQuestion",
    Cloze = "ClozeQuestion",
    Association = "AssociationQuestion",
    ExactAnswer = "ExactAnswerQuestion",
    Numeric = "NumericQuestion",
    SelfAssessment = "SelfAssessmentQuestion",
}

const resolvers: Resolvers = {
    QuizMutation: {
        addMultipleChoiceQuestion: {
            /**
             * @param root { assessmentId: <UUID> } ???
             * @param _args GraqhQL function parameters defined in flashcard.graphqls file
             * @param context Browser context (https request headers, etc.)
             * @param info GraphQL info/ introspection object
             * @param params logger, currentUser, query, token, service objects, etc.
             * @returns resolved mutation
             */
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.QuizAssessment,
                    type: QuestionTypes.MultipleChoice,
                    mutationName: "_internal_noauth_addMultipleChoiceQuestion",
                    callback: handleQuestionMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                });
            },
        },
        updateMultipleChoiceQuestion: {
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.QuizAssessment,
                    type: QuestionTypes.MultipleChoice,
                    mutationName: "_internal_noauth_updateMultipleChoiceQuestion",
                    callback: handleQuestionMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                    isUpdate: true,
                });
            },
        },
        addClozeQuestion: {
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.QuizAssessment,
                    type: QuestionTypes.Cloze,
                    mutationName: "_internal_noauth_addClozeQuestion",
                    callback: handleQuestionMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                });
            },
        },
        updateClozeQuestion: {
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.QuizAssessment,
                    type: QuestionTypes.Cloze,
                    mutationName: "_internal_noauth_updateClozeQuestion",
                    callback: handleQuestionMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                    isUpdate: true,
                });
            },
        },
        addAssociationQuestion: {
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.QuizAssessment,
                    type: QuestionTypes.Association,
                    mutationName: "_internal_noauth_addAssociationQuestion",
                    callback: handleQuestionMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                });
            },
        },
        updateAssociationQuestion: {
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.QuizAssessment,
                    type: QuestionTypes.Association,
                    mutationName: "_internal_noauth_updateAssociationQuestion",
                    callback: handleQuestionMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                    isUpdate: true,
                });
            },
        },
        addExactAnswerQuestion: {
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.QuizAssessment,
                    type: QuestionTypes.ExactAnswer,
                    mutationName: "_internal_noauth_addExactAnswerQuestion",
                    callback: handleQuestionMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                });
            },
        },
        updateExactAnswerQuestion: {
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.QuizAssessment,
                    type: QuestionTypes.ExactAnswer,
                    mutationName: "_internal_noauth_updateExactAnswerQuestion",
                    callback: handleQuestionMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                    isUpdate: true,
                });
            },
        },
        addNumericQuestion: {
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.QuizAssessment,
                    type: QuestionTypes.Numeric,
                    mutationName: "_internal_noauth_addNumericQuestion",
                    callback: handleQuestionMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                });
            },
        },
        updateNumericQuestion: {
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.QuizAssessment,
                    type: QuestionTypes.Numeric,
                    mutationName: "_internal_noauth_updateNumericQuestion",
                    callback: handleQuestionMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                    isUpdate: true,
                });
            },
        },
        addSelfAssessmentQuestion: {
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.QuizAssessment,
                    type: QuestionTypes.SelfAssessment,
                    mutationName: "_internal_noauth_addSelfAssessmentQuestion",
                    callback: handleQuestionMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                });
            },
        },
        updateSelfAssessmentQuestion: {
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.QuizAssessment,
                    type: QuestionTypes.SelfAssessment,
                    mutationName: "_internal_noauth_updateSelfAssessmentQuestion",
                    callback: handleQuestionMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                    isUpdate: true,
                });
            },
        },
    },
};

const handleQuestionMutationCallback: CallbackAfterAssessmentMutation<AssessmentItemType.QuizAssessment> = async ({
    logger,
    type,
    root,
    _args,
    context,
    info,
    isUpdate,
    mutationName,
    returnItem,
    contentUpdated,
}) => {
    logger.log(4, true, `mutating question item with id "${returnItem.id}"...`);
    try {
        const questionMutated = await mutateAssessmentInQuizService(
            logger,
            type,
            root,
            context,
            info,
            mutationName,
            contentUpdated,
            _args.assessmentId
        );
        logger.log(
            4,
            false,
            `question content ${isUpdate ? "updated" : "added"}:`,
            questionMutated[mutationName].questionPool.find(
                (questionFetched) => questionFetched.itemId === returnItem.id
            )
        );

        logger.log(5, true, "finished");
        return {
            assessmentId: questionMutated[mutationName].assessmentId,
            questionPool: questionMutated[mutationName].questionPool,
            item: returnItem,
        };
    } catch (error) {
        console.error("Error mutating question:", error);
    }
};

const mutateAssessmentInQuizService = async (
    logger,
    type: QuestionTypes,
    root,
    context,
    info,
    mutationName,
    questionInput,
    assessmentId
) => {
    let questionTypeDependentFields;
    switch (type) {
        case QuestionTypes.MultipleChoice: {
            questionTypeDependentFields = /* GraphQL */ `
                answers: [
                    ${questionInput.answers.map(
                        (answer) => `{
                        answerText: ${JSON.stringify(answer.answerText)},
                        correct: ${answer.correct},
                        ${answer.feedback ? `feedback: ${JSON.stringify(answer.feedback)}` : ""}
                    }`
                    )}
                ],
            `;
            break;
        }
        case QuestionTypes.Cloze: {
            questionTypeDependentFields = /* GraphQL */ `
                clozeElements: [
                    ${questionInput.clozeElements.map((element) => {
                        if (element.type === "TEXT") {
                            return `{
                                type: TEXT,
                                ${element.text ? `text: ${JSON.stringify(element.text)}` : ""}
                            }`;
                        } else if (element.type === "BLANK") {
                            return `{
                                type: BLANK,
                                ${element.correctAnswer ? `correctAnswer: "${element.correctAnswer}",` : ""}
                                ${element.feedback ? `feedback: ${JSON.stringify(element.feedback)}` : ""}
                            }`;
                        }
                    })}
                ],
                additionalWrongAnswers: [ ${questionInput.additionalWrongAnswers.map(
                    (wrongAnswer) => `"${wrongAnswer}"`
                )} ],
                showBlanksList: ${questionInput.showBlanksList},
            `;
            break;
        }
        case QuestionTypes.Association: {
            questionTypeDependentFields = /* GraphQL */ `
                correctAssociations: [
                    ${questionInput.correctAssociations.map(
                        (association) => `{
                        left: ${JSON.stringify(association.left)},
                        right: ${JSON.stringify(association.right)},
                        ${association.feedback ? `feedback: ${JSON.stringify(association.feedback)}` : ""}
                    }`
                    )}
                ],
            `;
            break;
        }
        case QuestionTypes.ExactAnswer: {
            questionTypeDependentFields = /* GraphQL */ `
                caseSensitive: ${questionInput.caseSensitive},
                correctAnswers: [
                    ${questionInput.correctAnswers.map((answer) => `"${answer}"`)}
                ],
                ${questionInput.feedback ? `feedback: ${JSON.stringify(questionInput.feedback)}` : ""}
            `;
            break;
        }
        case QuestionTypes.Numeric: {
            questionTypeDependentFields = /* GraphQL */ `
                correctAnswer: ${questionInput.correctAnswer},
                tolerance: ${questionInput.tolerance},
                feedback: "${questionInput.feedback}",
            `;
            break;
        }
        case QuestionTypes.SelfAssessment: {
            questionTypeDependentFields = /* GraphQL */ `
                solutionSuggestion: "${questionInput.solutionSuggestion}",
            `;
            break;
        }
        default:
            throw new Error(`Unknown internal question type provided: ${type}`);
    }

    const selectionSetMutationName = /* GraphQL */ `${mutationName}(input: {
        itemId: "${questionInput.itemId}",
        ${questionInput.number !== undefined ? `number: ${questionInput.number},` : ""}
        ${questionInput.text !== undefined ? `text: ${JSON.stringify(questionInput.text)},` : ""}
        ${questionTypeDependentFields}
        ${questionInput.hint ? `hint: ${JSON.stringify(questionInput.hint)}` : ""}
    })`;
    logger.log(4, false, "mutation content", selectionSetMutationName);

    let fragment;
    switch (type) {
        case QuestionTypes.MultipleChoice:
            fragment = /* GraphQL */ `
                    ... on MultipleChoiceQuestion {
                        text,
                        answers {
                            answerText,
                            correct,
                            feedback
                        }
                    }
            `;
            break;
        case QuestionTypes.Cloze:
            fragment = /* GraphQL */ `
                    ... on ClozeQuestion {
                        text,
                        clozeElements {
                            __typename,
                            ... on ClozeTextElement { text },
                            ... on ClozeBlankElement { correctAnswer, feedback }
                        },
                        allBlanks,
                        showBlanksList,
                        additionalWrongAnswers
                    }
            `;
            break;
        case QuestionTypes.Association:
            fragment = /* GraphQL */ `
                    ... on AssociationQuestion {
                        text,
                        correctAssociations { left, right },
                        feedback
                    }
            `;
            break;
        default:
            fragment = "";
    }



    return await context.QuizService.Mutation.mutateQuiz({
        root,
        args: { assessmentId: assessmentId },
        selectionSet: /* GraphQL */ `{
            ${selectionSetMutationName} {
                assessmentId
                questionPool {
                    __typename
                    itemId
                    type
                    hint
                    number
                    ${fragment}
                }
            }
        }`,
        context,
        info,
    });
};

export default resolvers;
