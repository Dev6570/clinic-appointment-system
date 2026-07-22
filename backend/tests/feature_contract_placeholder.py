import pytest


def fail_feature_contract_test(feature_key: str, guidance: str) -> None:
    pytest.fail(
        f'[NIYATI_TEMPLATE_BASELINE] {feature_key} contract test is not implemented yet. {guidance}'
    )
