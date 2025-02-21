import { Resolvers } from "../.mesh";
import { AssessmentItemType, CallbackAfterAssessmentMutation, handleAssessmentMutationThenCallback } from "./lib";

export enum FlashcardTypes {
    StandardFlashcard = "StandardFlashcard",
}

const resolvers: Resolvers = {
    FlashcardSetMutation: {
        createFlashcard: {
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
                    assessmentType: AssessmentItemType.FlashcardAssessment,
                    type: FlashcardTypes.StandardFlashcard,
                    mutationName: "_internal_noauth_createFlashcard",
                    callback: handleFlashcardMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                });
            },
        },
        updateFlashcard: {
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.FlashcardAssessment,
                    type: FlashcardTypes.StandardFlashcard,
                    mutationName: "_internal_noauth_updateFlashcard",
                    callback: handleFlashcardMutationCallback,
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

const handleFlashcardMutationCallback: CallbackAfterAssessmentMutation<
    AssessmentItemType.FlashcardAssessment
> = async ({ logger, type, root, _args, context, info, isUpdate, mutationName, returnItem, contentUpdated }) => {
    logger.log(4, true, `mutating flashcard item with id "${returnItem.id}"...`);
    try {
        const flashcardMutated = await mutateFlashcardInFlashcardService(
            logger,
            type,
            root,
            context,
            info,
            mutationName,
            contentUpdated,
            _args.assessmentId
        );
        logger.log(4, false, `flashcard content ${isUpdate ? "updated" : "added"}:`, flashcardMutated[mutationName]);

        logger.log(5, true, "finished");
        return {
            flashcard: flashcardMutated[mutationName],
        };
    } catch (error) {
        console.error("Error mutating flashcard:", error);
    }
};

const mutateFlashcardInFlashcardService = async (
    logger,
    type: FlashcardTypes,
    root,
    context,
    info,
    mutationName,
    flashcardInput,
    assessmentId
) => {
    let flashcardTypeDependentFields;
    switch (type) {
        case FlashcardTypes.StandardFlashcard: {
            flashcardTypeDependentFields = /* GraphQL */ `
                sides: [
                    ${flashcardInput.sides.map(
                        (side) => `{
                        label: "${side.label}",
                        isQuestion: ${side.isQuestion},
                        isAnswer: ${side.isAnswer},
                        text: "${side.text}"
                    }`
                    )}
                ],
            `;
            break;
        }
        default:
            throw new Error(`Unknown internal flashcard type provided: ${type}`);
    }

    const mutationsSelectionSet = /* GraphQL */ `${mutationName}(input: {
        itemId: "${flashcardInput.itemId}",
        ${flashcardTypeDependentFields}
    })`;
    logger.log(4, false, "mutation content", mutationsSelectionSet);

    return await context.FlashcardService.Mutation.mutateFlashcardSet({
        root,
        args: { assessmentId: assessmentId },
        selectionSet: /* GraphQL */ `{
            ${mutationsSelectionSet} {
                itemId
                sides {
                    label
                    isQuestion
                    isAnswer
                    text
                }
            }
        }`,
        context,
        info,
    });
};

export default resolvers;