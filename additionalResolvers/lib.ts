import { FlashcardTypes } from "./flashcard";
import { QuestionTypes } from "./quiz";
import { Args } from "./types";

export enum AssessmentItemType {
    QuizAssessment = "QuizAssessment",
    FlashcardAssessment = "FlashcardAssessment",
    SubmissionAssessment = "SubmissionAssessment",
}

class Logger {
    enabled: boolean;
    logPrefix: string;

    constructor(private readonly source: string) {
        // Second variable seems to be necessary to for the environment variable to be recognized correctly
        const enableLoggingEnv = process.env.ENABLE_LOGGING;
        this.enabled = Boolean(Number(enableLoggingEnv));

        this.logPrefix = `[${source}]`;
    }

    log(prefix: number | null, newLine: boolean, ...[infoMessage, ...args]: [string, ...any[]]) {
        if (!this.enabled) return;
        console.log(`${prefix ? `${newLine ? "\n" : ""}${this.logPrefix} > ${prefix}: ` : ""}${infoMessage}`, ...args);
    }
}

type QuizAssessmentMutation = {
    assessmentType: AssessmentItemType.QuizAssessment;
    type: QuestionTypes;
};
type FlashcardAssessmentMutation = {
    assessmentType: AssessmentItemType.FlashcardAssessment;
    type: FlashcardTypes;
};
type SubmissionAssessmentMutation = {
    assessmentType: AssessmentItemType.SubmissionAssessment;
    type: null
};

type AssessmentMutationHandlerArgs<T extends AssessmentItemType> = (T extends AssessmentItemType.FlashcardAssessment
    ? FlashcardAssessmentMutation
    : T extends AssessmentItemType.QuizAssessment
    ? QuizAssessmentMutation
    : T extends AssessmentItemType.SubmissionAssessment
    ? SubmissionAssessmentMutation
    : never) & {
    mutationName: string;
    callback: CallbackAfterAssessmentMutation<T>;
    root: any;
    _args: Args<T>;
    context: any;
    info: any;
    isUpdate?: boolean;
};

export type CallbackAfterAssessmentMutation<T extends AssessmentItemType> = (
    args: AssessmentMutationHandlerArgs<T> & {
        logger: Logger;
        returnItem: any;
        contentUpdated: any;
    }
) => Promise<any>;

export const handleAssessmentMutationThenCallback = async <T extends AssessmentItemType>(
    args: AssessmentMutationHandlerArgs<T>
) => {
    const { assessmentType, type, callback, root, _args, context, info, mutationName, isUpdate } = args;

    const logger = new Logger(type);
    enforceAdminPrivileges(context);

    logger.log(
        null,
        false,
        `
        - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        mutationName: ${type} - ${mutationName}
        - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`
    );

    logger.log(1, true, `fetching assessment with id "${_args.assessmentId}"...`);
    let assessment = await fetchAssessmentFromContentService(assessmentType, root, context, info, _args.assessmentId);
    logger.log(1, false, "assessment fetched:", assessment);

    const assessmentItemsNotUpdated = assessment.items;

    // update or add the assessment item, them mutate the assessment entity in the content service
    // if the assessment item hasn't changed, skip the mutation

    let skipAssessmentUpdate = false;
    if (isUpdate) {
        // Replace existing item with updated one provided in _args
        const itemIndexToBeUpdated = assessment.items.findIndex((item) => item.id === _args.item.id);
        if (itemIndexToBeUpdated === -1) {
            // should never happen
            throw new Error(`Item with id "${_args.item.id}" not found in assessment.`);
        }

        logger.log(2, true, "replacing assessment item", assessment.items[itemIndexToBeUpdated], "\nwith", _args.item);
        // stringify cost less than unnecessary mutation
        if (JSON.stringify(assessment.items[itemIndexToBeUpdated]) === JSON.stringify(_args.item)) {
            skipAssessmentUpdate = true;
            logger.log(2, false, 'assessment item did not change, skipping "3: assessment mutation"');
        } else {
            assessment.items.splice(itemIndexToBeUpdated, 1, _args.item);
        }
    } else {
        // Add new item (e.g. a new quiz) to the assessment (e.g. a quiz assessment)
        logger.log(2, true, "adding assessment item", _args.item);
        assessment.items = [...assessment.items, _args.item];
    }

    if (!skipAssessmentUpdate) {
        logger.log(3, true, "mutating assessment...");
        const updatedAssessment = await mutateAssessmentInContentService(
            root,
            context,
            info,
            assessment,
            _args.assessmentId
        );
        assessment = updatedAssessment.updateAssessment;
    }
    // Determine the input parameter name based on the assessment type

    let inputType;
    switch (assessmentType) {
        case AssessmentItemType.QuizAssessment:
            inputType = "questionInput";
            break;
        case AssessmentItemType.FlashcardAssessment:
            inputType = "flashcardInput";
            break;
        case AssessmentItemType.SubmissionAssessment:
            inputType = "submissionInput";
            break;
        default:
            throw new Error(`Unsupported assessment type: ${assessmentType}`);
    }

    // Quiz, Flashcard, etc. entity with applied update from parameters
    // Changes will be propagated to the entity in the respective service my GraphQL mutation in the callback function
    let contentUpdated;
    // Assessment item that was updated or added - will be returned back to the client
    let returnItem;
    if (isUpdate) {
        contentUpdated = _args[inputType];
        const updatedItemAssessment = assessment.items.find((item) => item.id === _args.item.id);
        returnItem = updatedItemAssessment;
    } else {
        const assessmentItemAdded = assessment.items.find(
            (item) => !assessmentItemsNotUpdated.some((oldItem) => oldItem.id === item.id)
        )!;
        contentUpdated = { ..._args[inputType], itemId: assessmentItemAdded.id /* newItem.id */ };
        returnItem = assessmentItemAdded;
    }
    if (!skipAssessmentUpdate) logger.log(3, false, `assessment item ${isUpdate ? "updated" : "added"}:`, returnItem);

    return callback({
        logger,
        returnItem,
        contentUpdated,
        ...args,
    });
};

const enforceAdminPrivileges = (context) => {
    if (!context.currentUser.courseMemberships.some((membership) => membership.role === "ADMINISTRATOR")) {
        throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
    }
};

/**
 * Fetch assessment to the id provided from the content service
 * Performs a GraphQL query via a multiline string
 */
const fetchAssessmentFromContentService = async (assessmentType, root, context, info, assessmentId) => {
    let assessmentMutationString;
    switch (assessmentType) {
        case AssessmentItemType.QuizAssessment:
            assessmentMutationString = "QuizAssessment";
            break;
        case AssessmentItemType.FlashcardAssessment:
            assessmentMutationString = "FlashcardSetAssessment";
            break;
        case AssessmentItemType.SubmissionAssessment:
            assessmentMutationString = "SubmissionAssessment";
            break;
        default:
            throw new Error(`Unsupported assessment type: ${assessmentType}`);
    }
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
                ... on ${assessmentMutationString} {
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

/**
 * Update the assessment entity in the content service with the assessment provided
 * Performs a GraphQL mutation with a query created in a multiline string
 */
const mutateAssessmentInContentService = async (root, context, info, assessment, assessmentId) => {
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
