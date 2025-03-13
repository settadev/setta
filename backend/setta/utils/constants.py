import json
import logging
from pathlib import Path

from .utils import get_absolute_path, is_dev_mode

logger = logging.getLogger(__name__)

CONSTANTS_FOLDER = (
    Path("../../../constants") if is_dev_mode() else Path("../static/constants")
)
SEED_FOLDER = Path("../../../seed") if is_dev_mode() else Path("../static/seed")
CWD = Path.cwd()
SETTA_FILES_FOLDER = CWD / "setta_files"
CODE_FOLDER = SETTA_FILES_FOLDER / "code"
DB_BACKUP_FOLDER = SETTA_FILES_FOLDER / "backups"
CODE_FOLDER_ENV_VARIABLE = "SETTA_CODE_FOLDER"
HOST_ENV_VARIABLE = "SETTA_HOST"
PORT_ENV_VARIABLE = "SETTA_PORT"


class Constants:
    def __init__(self):
        self._initialized = False

    def _ensure_initialized(self):
        if not self._initialized:
            load_constants()
            self._initialized = True

    def __getattr__(self, name):
        if name == "_initialized":
            return object.__getattribute__(self, name)
        self._ensure_initialized()
        return object.__getattribute__(self, name)

    @property
    def FRONTEND_ORIGINS(self):
        self._ensure_initialized()
        if is_dev_mode():
            output = [f"http://{self.HOST}:{self.DEV_MODE_FRONTEND_PORT}"]
        else:
            output = [self.BACKEND]
        if self.HOST == "127.0.0.1":
            output.append(output[0].replace("127.0.0.1", "localhost"))
        return output

    @property
    def BACKEND(self):
        self._ensure_initialized()
        return f"http://{self.HOST}:{self.PORT}"

    @property
    def WEBSOCKET(self):
        self._ensure_initialized()
        return f"ws://{self.HOST}:{self.PORT}{self.ROUTE_PREFIX}{self.ROUTE_WEBSOCKET_MANAGER}"


C = Constants()
USER_SETTINGS = {}
BASE_UI_TYPES = {}
BASE_UI_TYPE_IDS = {}
DEFAULT_VALUES = {}


def set_constants(**kwargs):
    for k, v in kwargs.items():
        setattr(C, k.upper(), v)


def load_constants():
    logger.debug("Loading constants")
    with open(
        get_absolute_path(__file__, CONSTANTS_FOLDER / "constants.json"), "r"
    ) as f:
        set_constants(**json.load(f))

    with open(
        get_absolute_path(__file__, CONSTANTS_FOLDER / "BaseUITypes.json"), "r"
    ) as f:
        BASE_UI_TYPES.update(json.load(f))
        for k, v in BASE_UI_TYPES.items():
            BASE_UI_TYPE_IDS[v["type"]] = k

    with open(
        get_absolute_path(__file__, CONSTANTS_FOLDER / "defaultValues.json"), "r"
    ) as f:
        DEFAULT_VALUES.update(json.load(f))


CODE_INFO_TABLE_DATA_JSON_FIELDS = set(
    (
        "editable",
        "rcType",
        "defaultVal",
        "description",
        "passingStyle",
        "isPinned",
        "isFrozen",
        "ignoreTypeErrors",
    )
)

SECTION_TABLE_DATA_JSON_FIELDS = set(
    (
        "social",
        "codeLanguage",
        "runInMemory",
        "isFrozen",
        "hideParams",
        "hideSearch",
        "hideUnpinnedParams",
        "displayMode",
        "visibility",
        "canvasSettings",
        "chartSettings",
        "renderMarkdown",
        "paramFilter",
        "columnWidth",
        "renderedValue",
        "isReadOnlyTerminal",
        "subprocessStartMethod",
        "headingAsSectionName",
    )
)

SECTION_CONFIG_TABLE_DATA_JSON_FIELDS = set(
    (
        "size",
        "isHorizontalOrientation",
        "pinnedAreaHeight",
        "isMinimized",
        "positionAndSizeLocked",
    )
)

SECTION_VARIANT_ID_TABLE_DATA_JSON_FIELDS = set(
    [
        "code",
        "description",
        "isFrozen",
        "configLanguage",
        "isJsonSource",
        "jsonSourceKeys",
    ]
)

SECTION_VARIANT_EV_TABLE_DATA_JSON_FIELDS = set(["value"])


UI_TYPE_TABLE_DATA_JSON_FIELDS = set(
    [
        "name",
        "presetType",
        "config",
    ]
)

PROJECT_CONFIG_TABLE_DATA_JSON_FIELDS = set(
    ["viewport", "previewImgColor", "viewingEditingMode"]
)


class ParameterPassingStyle:
    DEFAULT = "DEFAULT"
    ARGS = "ARGS"
    KWARGS = "KWARGS"
    POSITIONAL_ONLY = "POSITIONAL_ONLY"
    KEYWORD_ONLY = "KEYWORD_ONLY"
