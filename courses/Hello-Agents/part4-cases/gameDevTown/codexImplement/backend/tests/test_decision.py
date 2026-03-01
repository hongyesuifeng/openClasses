from app.core.decision import DecisionSystem


def test_weighted_decision():
    ds = DecisionSystem()
    options = [{"id": "A", "name": "A方案"}, {"id": "B", "name": "B方案"}]
    votes = {
        "developer": {"choice": "B", "confidence": 0.9},
        "producer": {"choice": "B", "confidence": 0.7},
        "designer": {"choice": "A", "confidence": 0.6},
        "artist": {"choice": "A", "confidence": 0.5},
    }
    result = ds.decide("技术选型", "technical", options, votes)
    assert result.option_id == "B"
    assert result.score_board["B"] > result.score_board["A"]
