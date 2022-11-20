<?php

namespace App\Controller;

use App\Service\Api;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class DashboardController extends AbstractController
{
    private Api $api;

    /**
     * @param \App\Service\Api $api
     */
    public function __construct(Api $api)
    {
        $this->api = $api;
    }

    /**
     * @Route("/home", name="home")
     */
    public function home(Request $request): Response
    {
        $token = $request->getSession()->get('token');

        $data = $this->api->user($token);

        if (!isset($data['data']) || !isset($data['data']['tips'])) {
            $games = [];
        } else {
            $games = $data['data']['tips'];
        }

        $table = $this->api->table($token);


        if (!isset($table['data']) || !isset($table['data']['users'])) {
            return $this->redirectToRoute('app_logout');
        }

        $users = $table['data']['users'];

//        $dailyWinnersApi = $this->api->dailyWinners($token);
//        $dailyWinners = [];
//        if (isset($dailyWinnersApi['data'])) {
//            $dailyWinners = array_slice($dailyWinnersApi['data'], -2, 2, true);
//        }


        return $this->render('home/index.html.twig', [
            'games' => $games,
             'users' => $users,
            'dailyWinners' =>  [],
        ]);
    }

    /**
     * @Route("/daily-winners", name="daily_winners")
     */
    public function dailyWinners(Request $request): Response
    {
        $token = $request->getSession()->get('token');

        $dailyWinnersApi = $this->api->dailyWinners($token);
        if (!isset($dailyWinnersApi['data']) || $dailyWinnersApi['success'] !== true) {
            return $this->redirectToRoute('app_logout');
        }

        return $this->render('home/winner-of-the-day-table.html.twig', [
            'dailyWinners' => $dailyWinnersApi['data'],
        ]);
    }

    /**
     * @Route("/game/{matchId}", name="user_tips_game")
     */
    public function gameTips(string $matchId, Request $request): Response
    {
        $token = $request->getSession()->get('token');
        $gamesInfo = $this->api->tipsGameInfo($token, $matchId);

        if (!isset($gamesInfo['success'])) {
            return $this->redirectToRoute('app_logout');
        }

        if ($gamesInfo['success'] === false) {
            return $this->redirectToRoute('home');
        }

        $data = $gamesInfo['data'];

        $win4point = [];
        $win2point = [];
        $win1point = [];
        $looser = [];

        foreach ($data['usersTip'] as $userTip) {
            if ($userTip['score'] === 4) {
                $win4point[] = $userTip;
            }
            if ($userTip['score'] === 2) {
                $win2point[] = $userTip;
            }
            if ($userTip['score'] === 1) {
                $win1point[] = $userTip;
            }
            if ($userTip['score'] === 0) {
                $looser[] = $userTip;
            }
        }

        unset($data['usersTip']);

        return $this->render('home/game.html.twig', [
            'data' => $data,
            'win4point' => $win4point,
            'win2point' => $win2point,
            'win1point' => $win1point,
            'looser' => $looser,
        ]);
    }

    /**
     * @Route("/tips/{username}", name="user_past_tips")
     */
    public function userPastTips(Request $request, string $username): Response
    {
        $token = $request->getSession()->get('token');
        $data = $this->api->userTips($token, $username);

        if (!isset($data['data'])) {
            return $this->redirectToRoute('app_logout');
        }

        return $this->render('home/user-tips.html.twig', [
            'user' => $data['data'],
        ]);
    }

    /**
     * @Route("/table", name="table")
     */
    public function table(Request $request): Response
    {
        $token = $request->getSession()->get('token');
        $data = $this->api->table($token);

        if (!isset($data['data']) || !isset($data['data']['users'])) {
            return $this->redirectToRoute('app_logout');
        }

        return $this->render('home/table.html.twig', [
            'users' => $data['data']['users'],
        ]);
    }

    /**
     * @Route("/test", name="test")
     */
    public function test(Request $request): Response
    {
        $token = $request->getSession()->get('token');
        $conetnt = json_decode($request->getContent(), true);

        $conetnt['tipTeam1'] = (int)$conetnt['tipTeam1'];
        $conetnt['tipTeam2'] = (int)$conetnt['tipTeam2'];

        $data = $this->api->tips($token, $conetnt);
        $json = json_encode($data);

        return new Response($json);
    }
}
