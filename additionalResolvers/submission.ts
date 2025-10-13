import { Resolvers } from "../.mesh";
import { AssessmentItemType, CallbackAfterAssessmentMutation, handleAssessmentMutationThenCallback } from "./lib";
import {QuestionTypes} from "./quiz";

const resolvers: Resolvers = {
    SubmissionMutation: {
        addTask: {
            /**
             * @param root { assessmentId: <UUID> } ???
             * @param _args GraqhQL function parameters defined in submissions.graphqls file
             * @param context Browser context (https request headers, etc.)
             * @param info GraphQL info/ introspection object
             * @param params logger, currentUser, query, token, service objects, etc.
             * @returns resolved mutation
             */
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.SubmissionAssessment,
                    type: null,
                    mutationName: "_internal_noauth_addTask",
                    callback: handleSubmissionMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                });
            },
        },
        updateTask: {
            /**
             * @param root { assessmentId: <UUID> } ???
             * @param _args GraqhQL function parameters defined in submissions.graphqls file
             * @param context Browser context (https request headers, etc.)
             * @param info GraphQL info/ introspection object
             * @param params logger, currentUser, query, token, service objects, etc.
             * @returns resolved mutation
             */
            async resolve(root, _args, context, info) {
                return handleAssessmentMutationThenCallback({
                    assessmentType: AssessmentItemType.SubmissionAssessment,
                    type: null,
                    mutationName: "_internal_noauth_updateTask",
                    callback: handleSubmissionMutationCallback,
                    root,
                    _args,
                    context,
                    info,
                    isUpdate: true,
                });
            },
        }
    }
}

const handleSubmissionMutationCallback: CallbackAfterAssessmentMutation<AssessmentItemType.SubmissionAssessment> = async ({

    logger,
    root,
    _args,
    context,
    info,
    isUpdate,
    mutationName,
    returnItem,
    contentUpdated,
}) => {
    logger.log(4, true, `mutating submission item with id "${returnItem.id}"...`);
    try {
        const submissionMutated = await mutateSubmissionAssessmentInMediaService(
            logger,
            root,
            context,
            info,
            mutationName,
            contentUpdated,
            _args.assessmentId
        );
        const modifiedTask = submissionMutated[mutationName].tasks.find(
            (taskFetched) => taskFetched.itemId === returnItem.id
        );
        logger.log(4, false, `task content ${isUpdate ? "updated" : "added"}:`, modifiedTask);

        logger.log(5, true, "finished");
        return {
            assessmentId: submissionMutated[mutationName].assessmentId,
            tasks: submissionMutated[mutationName].tasks,
            modifiedTask: modifiedTask,
        };
    } catch (error) {
        console.error("Error mutating submission:", error);
    }
};

const mutateSubmissionAssessmentInMediaService = async (
    logger,
    root,
    context,
    info,
    mutationName,
    taskInput,
    assessmentId
) => {
    const selectionSetMutationName = /* GraphQL */ `${mutationName}(input: {
        itemId: "${taskInput.itemId}",
        maxScore: ${taskInput.maxScore},
        name: "${taskInput.name}",
        number: ${taskInput.number}
    })`;
    logger.log(4, false, "mutation content", selectionSetMutationName);

    return await context.MediaService.Mutation.mutateSubmission({
        root,
        args: { assessmentId: assessmentId },
        selectionSet: /* GraphQL */ `{
            ${selectionSetMutationName} {
            assessmentId
            courseId
            endDate
            tasks {
                name,
                itemId,
                maxScore,
                number
            }
        }
        }`,
        context,
        info,
    });
};

export default resolvers;