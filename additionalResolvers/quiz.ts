import { Resolvers } from "../.mesh";

const resolvers: Resolvers = {
    QuizMutation: {
        addMultipleChoiceQuestion: {
            async resolve(root, _args, context, info) {
                return handleQuestionMutation(
                    QuestionType.MultipleChoice,
                    root,
                    _args,
                    context,
                    info,
                    "_internal_noauth_addMultipleChoiceQuestion"
                );
            },
        },
        updateMultipleChoiceQuestion: {
            async resolve(root, _args, context, info) {
                return handleQuestionMutation(
                    QuestionType.MultipleChoice,
                    root,
                    _args,
                    context,
                    info,
                    "_internal_noauth_updateMultipleChoiceQuestion",
                    true
                );
            },
        },
        addClozeQuestion: {
            async resolve(root, _args, context, info) {
                return handleQuestionMutation(
                    QuestionType.Cloze,
                    root,
                    _args,
                    context,
                    info,
                    "_internal_noauth_addClozeQuestion"
                );
            },
        },
        updateClozeQuestion: {
            async resolve(root, _args, context, info) {
                return handleQuestionMutation(
                    QuestionType.Cloze,
                    root,
                    _args,
                    context,
                    info,
                    "_internal_noauth_updateClozeQuestion",
                    true
                );
            },
        },
        addAssociationQuestion: {
            async resolve(root, _args, context, info) {
                return handleQuestionMutation(
                    QuestionType.Association,
                    root,
                    _args,
                    context,
                    info,
                    "_internal_noauth_addAssociationQuestion"
                );
            },
        },
        updateAssociationQuestion: {
            async resolve(root, _args, context, info) {
                return handleQuestionMutation(
                    QuestionType.Association,
                    root,
                    _args,
                    context,
                    info,
                    "_internal_noauth_updateAssociationQuestion",
                    true
                );
            },
        },
        addExactAnswerQuestion: {
            async resolve(root, _args, context, info) {
                return handleQuestionMutation(
                    QuestionType.ExactAnswer,
                    root,
                    _args,
                    context,
                    info,
                    "_internal_noauth_addExactAnswerQuestion"
                );
            },
        },
        updateExactAnswerQuestion: {
            async resolve(root, _args, context, info) {
                return handleQuestionMutation(
                    QuestionType.ExactAnswer,
                    root,
                    _args,
                    context,
                    info,
                    "_internal_noauth_updateExactAnswerQuestion",
                    true
                );
            },
        },
        addNumericQuestion: {
            async resolve(root, _args, context, info) {
                return handleQuestionMutation(
                    QuestionType.Numeric,
                    root,
                    _args,
                    context,
                    info,
                    "_internal_noauth_addNumericQuestion"
                );
            },
        },
        updateNumericQuestion: {
            async resolve(root, _args, context, info) {
                return handleQuestionMutation(
                    QuestionType.Numeric,
                    root,
                    _args,
                    context,
                    info,
                    "_internal_noauth_updateNumericQuestion",
                    true
                );
            },
        },
        addSelfAssessmentQuestion: {
            async resolve(root, _args, context, info) {
                return handleQuestionMutation(
                    QuestionType.SelfAssessment,
                    root,
                    _args,
                    context,
                    info,
                    "_internal_noauth_addSelfAssessmentQuestion"
                );
            },
        },
        updateSelfAssessmentQuestion: {
            async resolve(root, _args, context, info) {
                return handleQuestionMutation(
                    QuestionType.SelfAssessment,
                    root,
                    _args,
                    context,
                    info,
                    "_internal_noauth_updateSelfAssessmentQuestion",
                    true
                );
            },
        },
    },
};

const handleQuestionMutation = async (
    type: QuestionType,
    root,
    _args,
    context,
    info,
    mutationName,
    isUpdate = false
) => {
    // Second variable seems to be necessary to for the environment variable to be recognized correctly
    const enableLoggingEnv = process.env.ENABLE_LOGGING;
    const ENABLE_LOGGING = Boolean(Number(enableLoggingEnv));

    enforceAdminPrivileges(context);

    if (ENABLE_LOGGING)
        console.log(`
    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    mutationName: ${type} - ${mutationName}
    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  `);

    const assessment = await fetchAssessment(root, context, info, _args.assessmentId);
    if (ENABLE_LOGGING) console.log("\n1: assessment:", assessment);
    const oldAssessmentItems = assessment.items;

    if (isUpdate) {
        // Replace existing item with updated one provided in _args
        const itemIndexToBeUpdated = assessment.items.findIndex((item) => item.id === _args.item.id);
        console.log("itemIndexToBeUpdated:", itemIndexToBeUpdated);
        assessment.items.splice(itemIndexToBeUpdated, 1, _args.item);
    } else {
        // Add new item (e.g. a new quiz) to the assessment (e.g. a quiz assessment)
        assessment.items = [...assessment.items, _args.item];
    }
    if (ENABLE_LOGGING) console.log("\n2: assessmentAdjusted:", assessment);

    const updatedAssessment = await updateAssessment(root, context, info, assessment, _args.assessmentId);
    if (ENABLE_LOGGING) console.log("\n3: updatedItems:", updatedAssessment);

    let questionInput;
    let returnItem;
    if (isUpdate) {
        questionInput = _args.questionInput;
        returnItem = updatedAssessment.updateAssessment.items.find((item) => item.id === _args.item.id);
    } else {
        const updatedAssessmentWithArgItem = updatedAssessment.updateAssessment.items.find(
            (item) => !oldAssessmentItems.some((oldItem) => oldItem.id === item.id)
        );
        questionInput = { ..._args.questionInput, itemId: updatedAssessmentWithArgItem.id /* newItem.id */ };
        returnItem = updatedAssessmentWithArgItem;
    }
    if (ENABLE_LOGGING) console.log("\n4: questionInput:", questionInput);

    // const questionInput = _args.questionInput // this is present in many methods - maybe author forgot to remove it?

    const question = await mutateQuizQuestion(
        type,
        root,
        context,
        info,
        mutationName,
        questionInput,
        _args.assessmentId
    );
    if (ENABLE_LOGGING) console.log("\n5: question:", question);

    return {
        assessmentId: question[mutationName].assessmentId,
        questionPool: question[mutationName].questionPool,
        item: returnItem,
    };
};

const enforceAdminPrivileges = (context) => {
    if (!context.currentUser.courseMemberships.some((membership) => membership.role === "ADMINISTRATOR")) {
        throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
    }
};

// Helper function to fetch assessment details
const fetchAssessment = async (root, context, info, assessmentId) => {
    const assessments = await context.ContentService.Query.findContentsByIds({
        root,
        args: { ids: [assessmentId] },
        selectionSet: /* GraphQL */ `
            {
                metadata {
                    name
                    rewardPoints
                    suggestedDate
                    tagNames
                    chapterId
                }
                ... on QuizAssessment {
                    assessmentMetadata {
                        initialLearningInterval
                        skillPoints
                        skillTypes
                    }
                    items {
                        id
                        associatedSkills {
                            id
                            skillName
                            skillCategory
                            isCustomSkill
                        }
                        associatedBloomLevels
                    }
                }
            }
        `,
        context,
        info,
    });

    return assessments[0];
};

// Helper function to update assessment
const updateAssessment = async (root, context, info, assessment, assessmentId) => {
    const selectionSet = /* GraphQL */ `{updateAssessment(input: {
        metadata: {
            name: "${assessment.metadata.name}",
            suggestedDate: "${assessment.metadata.suggestedDate}",
            chapterId: "${assessment.metadata.chapterId}",
            rewardPoints: ${assessment.metadata.rewardPoints},
            tagNames: [${assessment.metadata.tagNames.map((tag) => `"${tag}"`)}]
        },
        assessmentMetadata: {
            skillPoints: ${assessment.assessmentMetadata.skillPoints},
            skillTypes: [${assessment.assessmentMetadata.skillTypes.map((skillType) => `${skillType}`)}],
            initialLearningInterval: ${assessment.assessmentMetadata.initialLearningInterval}
        },
        items: [
            ${assessment.items.map(mapItemToGraphQL)}
        ]
    }) {
        id
        items {
            id
            associatedSkills {
                id,
                skillName,
                skillCategory,
                isCustomSkill
            }
            associatedBloomLevels
        }
    }}`;

    return await context.ContentService.Mutation.mutateContent({
        root,
        args: { contentId: assessmentId },
        selectionSet,
        context,
        info,
    });
};

const mapItemToGraphQL = (item) => /* GraphQL */ `{
    ${item.id ? `id: "${item.id}",` : ""}
    associatedSkills: [
        ${item.associatedSkills.map(
            (skill) => `{
                ${skill.id ? `id: "${skill.id}",` : ""}
                skillName: "${skill.skillName}",
                skillCategory: "${skill.skillCategory}",
                isCustomSkill: ${skill.isCustomSkill}
            }`
        )}
    ],
    associatedBloomLevels: [${item.associatedBloomLevels.map((level) => `${level}`)}]
}`;

enum QuestionType {
    MultipleChoice = "MultipleChoiceQuestion",
    Cloze = "ClozeQuestion",
    Association = "AssociationQuestion",
    ExactAnswer = "ExactAnswerQuestion",
    Numeric = "NumericQuestion",
    SelfAssessment = "SelfAssessmentQuestion",
}

// Helper function to mutate quiz questions
const mutateQuizQuestion = async (
    type: QuestionType,
    root,
    context,
    info,
    mutationName,
    questionInput,
    assessmentId
) => {
    let questionTypeDependentFields;
    switch (type) {
        case QuestionType.MultipleChoice: {
            questionTypeDependentFields = /* GraphQL */ `
                answers: [
                    ${questionInput.answers.map(
                        (answer) => `{
                        answerText: ${JSON.stringify(answer.answerText)},
                        correct: ${answer.correct},
                        ${answer.feedback !== null ? `feedback: ${JSON.stringify(answer.feedback)}` : ""}
                    }`
                    )}
                ],
            `;
            break;
        }
        case QuestionType.Cloze: {
            questionTypeDependentFields = /* GraphQL */ `
                clozeElements: [
                    ${questionInput.clozeElements.map((element) => {
                        if (element.type === "TEXT") {
                            return `{
                                type: TEXT,
                                ${element.text !== null ? `text:${JSON.stringify(element.text)}` : ""}
                            }`;
                        } else if (element.type === "BLANK") {
                            return `{
                                type: BLANK,
                                ${element.correctAnswer !== null ? `correctAnswer:"${element.correctAnswer}",` : ""}
                                ${element.feedback !== null ? `feedback:${JSON.stringify(element.feedback)}` : ""}
                            }`;
                        }
                    })}
                ],
                additionalWrongAnswers: ["${questionInput.additionalWrongAnswers.join('", "')}" ],
                showBlanksList: ${questionInput.showBlanksList},
            `;
            break;
        }
        case QuestionType.Association: {
            questionTypeDependentFields = /* GraphQL */ `
                correctAssociations: [
                    ${questionInput.correctAssociations.map(
                        (association) => `{
                        left: ${JSON.stringify(association.left)},
                        right: ${JSON.stringify(association.right)},
                        ${association.feedback !== null ? `feedback: ${JSON.stringify(association.feedback)}` : ""}
                    }`
                    )}
                ],
            `;
            break;
        }
        case QuestionType.ExactAnswer: {
            questionTypeDependentFields = /* GraphQL */ `
                caseSensitive: ${questionInput.caseSensitive},
                correctAnswers: [
                    ${questionInput.correctAnswers.map((answer) => `"${answer}"`)}
                ],
                feedback: "${questionInput.feedback}",
            `;
            break;
        }
        case QuestionType.Numeric: {
            questionTypeDependentFields = /* GraphQL */ `
                correctAnswer: ${questionInput.correctAnswer},
                tolerance: ${questionInput.tolerance},
                feedback: "${questionInput.feedback}",
            `;
            break;
        }
        case QuestionType.SelfAssessment: {
            questionTypeDependentFields = /* GraphQL */ `
                solutionSuggestion: "${questionInput.solutionSuggestion}",
            `;
            break;
        }
    }

    const selectionSetMutationName = /* GraphQL */ `${mutationName}(input: {
        itemId: "${questionInput.itemId}",
        ${questionInput.number !== undefined ? `number: ${questionInput.number},` : ""}
        text: ${JSON.stringify(questionInput.text)},

        ${questionTypeDependentFields}

        ${questionInput.hint !== undefined ? `hint: ${JSON.stringify(questionInput.hint)}` : ""}
    })`;

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
                    ... on MultipleChoiceQuestion {
                        text,
                        answers {
                            answerText,
                            correct,
                            feedback
                        }
                    }
                    ... on ClozeQuestion {
                        clozeElements {
                            __typename,
                            ... on ClozeTextElement { text },
                            ... on ClozeBlankElement { correctAnswer, feedback }
                        },
                        allBlanks,
                        showBlanksList,
                        additionalWrongAnswers
                    }
                    ... on AssociationQuestion {
                        text,
                        correctAssociations { left, right }
                    }
                }
            }
        }`,
        context,
        info,
    });
};

export default resolvers;
