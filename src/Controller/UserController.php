<?php

namespace App\Controller;

use App\Security\User;
use App\Service\Api;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class UserController extends AbstractController
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
     * @Route("/register", name="user_register")
     */
    public function register(Request $request): Response
    {
        $token = $request->getSession()->get('token');
        if ($this->getUser() && $token) {
            return $this->redirectToRoute('home');
        }

        $user = new User();

        $error = '';
        if ($request->isMethod('POST')) {

            $user->setUsername($request->request->get('username'));
            $user->setPassword($request->request->get('password'));
            $user->setPasswordConfirm($request->request->get('passwordConfirm'));
            $user->setEmail($request->request->get('email'));
            $user->setTip1($request->request->get('tip1'));
            $user->setTip2($request->request->get('tip2'));

            $content = $this->api->register($user);

            if ($content['success'] === true) {
                $this->addFlash('success', 'Benutzer registriert');
                return $this->redirectToRoute('app_login');
            } else {
                $this->addFlash('error', $content['message']);
            }
        }

        return $this->render('user/register.html.twig', [
            'email' => $user->getEmail(),
            'username' => $user->getUsername(),
        ]);
    }
}
