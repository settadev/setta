from setta.utils.constants import C

# js->python conversion done by claude


def _findAllDescendants(
    allCodeInfo,
    codeInfoChildren,
    codeInfoIds,
    outputCondition,
    stackCondition,
    paramPathCondition=None,  # None or a function
    earlyReturnCondition=None,  # None or a function
):
    output = []
    idStack = list(reversed([x for x in codeInfoIds if stackCondition(allCodeInfo[x])]))
    visited = set()
    pathMap = {} if paramPathCondition else None

    if paramPathCondition:
        for id in idStack:
            pathMap[id] = [id] if paramPathCondition(allCodeInfo[id]) else []

    while len(idStack) > 0:
        id = idStack.pop()
        if not id or id in visited:
            continue
        visited.add(id)
        currInfo = allCodeInfo[id]

        if outputCondition(currInfo):
            output.append(currInfo["id"])

        if stackCondition(currInfo):
            children = list(reversed(codeInfoChildren[currInfo["id"]]))
            if paramPathCondition:
                currentPath = pathMap[id]
                for childId in children:
                    pathMap[childId] = (
                        [*currentPath, childId]
                        if paramPathCondition(allCodeInfo[childId])
                        else [*currentPath]
                    )
            idStack.extend(children)

        if (
            len(output) > 0
            and earlyReturnCondition
            and earlyReturnCondition(allCodeInfo[output[-1]])
        ):
            return {"ids": output, "pathMap": pathMap, "earlyReturnTriggered": True}

    return {"ids": output, "pathMap": pathMap, "earlyReturnTriggered": False}


def findAllParameters(
    allCodeInfo,
    codeInfoChildren,
    startingId,
    additionalOutputCondition=None,
    paramPathCondition=None,
    earlyReturnCondition=None,
):
    codeInfoIds = [startingId] if startingId else codeInfoChildren.get(startingId, None)

    # if startingId is None, then we're starting at the root
    # so we don't want to avoid the parameters of callables
    def stackCondition(c):
        return True if startingId else c.get("rcType") == C.PARAMETER

    return _findAllDescendants(
        allCodeInfo,
        codeInfoChildren,
        codeInfoIds or [],
        lambda c: c.get("rcType") == C.PARAMETER
        and (not additionalOutputCondition or additionalOutputCondition(c)),
        stackCondition,
        paramPathCondition,
        earlyReturnCondition,
    )


def findAllParametersAndPathMaps(**kwargs):
    return findAllParameters(
        **kwargs, paramPathCondition=lambda p: p.get("rcType") == C.PARAMETER
    )


def getParamIdsToShowInArea(
    isPinned,
    codeInfo,
    codeInfoChildren,
    parentCodeInfoId,
):
    result = findAllParametersAndPathMaps(
        allCodeInfo=codeInfo,
        codeInfoChildren=codeInfoChildren,
        startingId=parentCodeInfoId,
    )
    ids = result["ids"]
    pathMap = result["pathMap"]
    ids.reverse()

    topLevelParamIds = []
    topLevelParamIdsSet = set()
    requiredParamIdsToPaths = {}

    for a in ids:
        # Evaluates to true if:
        # 1. The current param's isPinned matches the isPinned condition
        # 2. And: either the param has no children or at least one of its children is required
        # This logic is why it's REQUIRED for ids to be reversed (processed starting with children up to ancestors)
        if bothTruthyOrFalsey(codeInfo[a].get("isPinned"), isPinned) and (
            len(codeInfoChildren[a]) == 0
            or any(child in requiredParamIdsToPaths for child in codeInfoChildren[a])
        ):
            for p in pathMap[a]:
                requiredParamIdsToPaths[p] = pathMap[p]
                if pathMap[a][0] not in topLevelParamIdsSet:
                    topLevelParamIds.append(pathMap[a][0])
                    topLevelParamIdsSet.add(pathMap[a][0])

    # unreverse results
    topLevelParamIds.reverse()

    return {
        "requiredParamIdsToPaths": requiredParamIdsToPaths,
        "topLevelParamIds": topLevelParamIds,
    }


def bothTruthyOrFalsey(a, b):
    return (not a) == (not b) or a == b
